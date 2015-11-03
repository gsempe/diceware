package main

import (
	"log"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

// https://socketloop.com/references/golang-crypto-sha256-functions-example
func main() {

	router := httprouter.New()
	router.POST("/pwd", NewPwd)
	router.HandleMethodNotAllowed = false
	log.Fatal(http.ListenAndServe(":8082", router))
}
