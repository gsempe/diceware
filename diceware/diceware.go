package diceware

import (
	"crypto/rand"
	"crypto/sha256"
)

type dwHash [sha256.Size]byte

type dwGenerator interface {
	findWords(lang string) []string
	decodeWord(s uint) (uint, int)
	decodeWordNumber(s uint) (uint, []uint8)
	decodeDiceValue(s uint, d []byte) uint8
	word(number int, lang string) string
}

// Passphrase generates a passphrase of l words, base on the entropy e and in the language lang
func Passphrase(l int, e []byte, lang string) ([]string, []int) {

	min := func(x, y int) int {
		if x < y {
			return x
		}
		return y
	}
	pp := make([]string, 0, l)
	ppn := make([]int, 0, l)
	for {
		r := l - len(pp)
		if r <= 0 {
			break
		}
		le := entropy(len(e))
		h := dwHash(hash(e, le))
		t, tn := h.findWords(lang)
		m := min(len(t), r)
		if m > 0 {
			pp = append(pp, t...)
			ppn = append(ppn, tn...)
		}
	}
	// Bound the number elements to l
	if len(pp) > l {
		pp = pp[:l]
		ppn = ppn[:l]
	}
	return pp, ppn
}

func (h *dwHash) findWords(lang string) ([]string, []int) {

	s := uint(0)
	pp := []string{}
	ppn := []int{}
	number := 0
	for {
		s, number = h.decodeWord(s)
		if number == 0 {
			// no more word available in this hash
			break
		}
		pp = append(pp, h.word(number, lang))
		ppn = append(ppn, number)
	}
	return pp, ppn
}

const dicewareNumberLength = 5

func (h *dwHash) decodeWord(s uint) (uint, int) {

	next, dices := h.decodeWordNumber(s)
	if len(dices) != dicewareNumberLength {
		return next, 0
	}
	number := 0
	for i := 0; i < len(dices); i++ {
		number = number * 10
		number = number + int(dices[i])
	}
	return next, number
}

func (h *dwHash) word(number int, lang string) string {

	w, err := word(number, lang)
	if err != nil {
		return ""
	}
	return w
}

const diceRawBitLength = 3

// decodeWordNumber
//
// It walks the hash h to find 5 valid dice values
func (h *dwHash) decodeWordNumber(s uint) (uint, []uint8) {

	d := make([]uint8, 0, 5)
	for {
		if s+diceRawBitLength-1 >= uint(len(h)*8) {
			// Not enough bits for another step
			break
		}
		B := s / 8
		b := s % 8
		v := h.decodeDiceValue(b, h[B:])
		if v == 0 || v == 7 {
			// Invalid dice value, walk the hash one more step
			s = s + diceRawBitLength
		} else {
			d = append(d, v)
			s = s + diceRawBitLength
			if len(d) >= 5 {
				// Stop the walk we got enough dice values
				break
			}
		}
	}
	return s, d
}

const diceRawBitMask = 0x7

func (h *dwHash) decodeDiceValue(s uint, d []byte) uint8 {

	e := (s + diceRawBitLength) - 1

	lsb := s / 8 // byte index of the lsb
	msb := e / 8 // byte index of the msb

	if lsb == msb {
		// all bits are on the same byte
		return (d[lsb] >> (8 - (e - (8 * lsb)) - 1)) & diceRawBitMask
	}
	r := s % 8
	l := (d[lsb] << (diceRawBitLength - (8 - r))) & diceRawBitMask
	m := (d[msb] >> (8 - (diceRawBitLength - (8 - r)))) & diceRawBitMask
	return (l | m)
}

// entropy gathers s bytes of entropy generated locally
func entropy(s int) []byte {

	le := make([]byte, s)
	_, err := rand.Read(le)
	if err != nil {
		// TODO(GSE): Monitor this case
	}
	return le
}

// hash xor the client entropy given with the same size of local entropy and generates a SHA256
func hash(entropy, localEntropy []byte) [sha256.Size]byte {

	safeXORBytes(entropy, entropy, localEntropy)
	return sha256.Sum256(entropy)
}

// safeXORBytes xors the bytes in a and b. The destination is assumed to have enough space. Returns the number of bytes xor'd.
//
// This method is extracted from crypto/cypher package: https://github.com/golang/go/blob/master/src/crypto/cipher/xor.go#L40-L49
func safeXORBytes(dst, a, b []byte) int {
	n := len(a)
	if len(b) < n {
		n = len(b)
	}
	for i := 0; i < n; i++ {
		dst[i] = a[i] ^ b[i]
	}
	return n
}
