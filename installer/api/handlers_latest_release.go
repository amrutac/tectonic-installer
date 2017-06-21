package api

import (
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
)

// latestReleaseHandler gets the tectonic's latest release from coreos.com.
func latestReleaseHandler(w http.ResponseWriter, req *http.Request, _ *Context) error {
	res, err := http.Get("https://coreos.com/tectonic/api/releases/latest")
	if err != nil {
		return newBadRequestError("Failed to get a response from coreos.com: %s", err)
	}
	responseData, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Fatal(err)
	}
	responseString := string(responseData)
	fmt.Fprintf(responseString)
	io.Copy(w, res.Body)

	res.Body.Close()
	return nil
}
