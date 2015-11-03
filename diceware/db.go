package diceware

import (
	"log"
	"strconv"

	"github.com/boltdb/bolt"
)

const dicewareDBName = "diceware.db"

var db *bolt.DB

func init() {

	var err error
	db, err = bolt.Open(dicewareDBName, 0666, &bolt.Options{ReadOnly: true})
	if err != nil {
		log.Fatal(err)
	}
}

func word(number int, lang string) (string, error) {
	var w string = ""
	var e error = nil
	if err := db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(lang))
		if v := b.Get([]byte(strconv.Itoa(number))); v != nil {
			w = string(v)
		}
		return nil
	}); err != nil {
		e = err
	}
	return w, e
}
