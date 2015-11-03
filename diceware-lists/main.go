package main

import (
	"bufio"
	"io"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/boltdb/bolt"
)

func main() {

	db, err := bolt.Open("diceware.db", 0600, nil)
	if err != nil {
		log.Fatal(err)
	}
	err = putENWordList(db)
	if err != nil {
		log.Fatal(err)
	}
	err = putFRWordList(db)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
}

func putENWordList(db *bolt.DB) error {

	return putWordListFromFile("diceware.wordlist.asc", "en", db)
}

func putFRWordList(db *bolt.DB) error {

	return putWordListFromFile("diceware-fr-5-jets.txt", "fr", db)
}

func putWordListFromFile(filename, language string, db *bolt.DB) error {

	f, err := os.Open(filename)
	if err != nil {
		return err
	}
	fr := bufio.NewReader(f)
	i := 0

	if err := db.Update(func(tx *bolt.Tx) error {

		b, err := tx.CreateBucketIfNotExists([]byte(language))
		if err != nil {
			return err
		}
		for {
			l, err := fr.ReadString('\n')
			if err != nil {
				if err == io.EOF {
					break
				} else {
					return err
				}
			}
			if len(l) > 5 {
				ns := string(l[:5])
				if n, err := strconv.Atoi(ns); err == nil {
					if n >= 11111 && n <= 66666 { // Sanity check
						i++
						w := strings.TrimSpace(l[5:])
						if err := b.Put([]byte(ns), []byte(w)); err != nil {
							return err
						}
						//log.Printf("%d:%v:", n, w)
					}
				}
			}
		}
		return nil
	}); err != nil {
		return err
	}
	log.Printf("%v, number of words put: %d", language, i)
	return nil
}
