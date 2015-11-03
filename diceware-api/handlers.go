package main

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/gsempe/diceware/diceware"
	"github.com/julienschmidt/httprouter"
	"github.com/unrolled/render"
)

type NewPwdRequestBody struct {
	Length   int    `json:length`
	Entropy  []byte `json:entropy`
	Language string `json:language`
}

type NewPwdResponseBody struct {
	Passphrase []string `json:passphrase`
	Numbers    []int    `json:numbers`
	Language   string   `json:language`
}

var (
	r *render.Render
)

func init() {

	r = render.New(render.Options{
		IsDevelopment:             true,
		RequireBlocks:             true,
		DisableHTTPErrorRendering: true,
	})
}

func NewPwd(w http.ResponseWriter, req *http.Request, _ httprouter.Params) {
	if !strings.HasPrefix(req.Header.Get("Content-Type"), "application/json") {
		r.JSON(w, http.StatusUnsupportedMediaType, map[string]string{"error": "invalid content type"})
		return
	}
	rawBody, err := ioutil.ReadAll(req.Body)
	if err != nil {
		r.JSON(w, http.StatusInternalServerError, map[string]string{"error": "Server error"})
		return
	}
	var body NewPwdRequestBody
	err = json.Unmarshal(rawBody, &body)
	if err != nil {
		r.JSON(w, http.StatusBadRequest, map[string]string{"error": "Body content is not valid JSON"})
		return
	}
	if len(body.Entropy) == 0 {
		r.JSON(w, http.StatusBadRequest, map[string]string{"error": "Not enought entropy provided"})
		return
	}
	pp, ppn := diceware.Passphrase(body.Length, body.Entropy, body.Language)
	response := NewPwdResponseBody{Passphrase: pp, Numbers: ppn, Language: body.Language}
	r.JSON(w, http.StatusOK, response)
}
