package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	stripe "github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/webhook"
)


func FulfillOrder(LineItemList *stripe.LineItemList) {
	fmt.Println("Fulfilling order")
  // TODO: fill me in
	desc := LineItemList.Data[0].Description
	id := LineItemList.Data[0].ID
	priceID := LineItemList.Data[0].Price.ID
	lookupKey := LineItemList.Data[0].Price.LookupKey
	productID := LineItemList.Data[0].Price.Product.ID
	created := LineItemList.Data[0].Price.Created

	fmt.Println("Description: ", desc)
	fmt.Println("ID: ", id)
	fmt.Println("Price ID: ", priceID)
	fmt.Println("Lookup Key: ", lookupKey)
	fmt.Println("Product ID: ", productID)
	fmt.Println("Created: ", time.Unix(created, 0).Format("2006-01-02 15:04:05"))
	// LinItemList.APIResource.Data[0].Description // ID // Price.Created Price.ID Price.LookupKey Price.Product.ID
}


func main() {
	stripe.Key = "..."
	http.HandleFunc("/webhook", func(w http.ResponseWriter, req *http.Request) {
		const MaxBodyBytes = int64(65536)
		req.Body = http.MaxBytesReader(w, req.Body, MaxBodyBytes)

		body, err := io.ReadAll(req.Body)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading request body: %v\n", err)
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}

		// fmt.Fprintf(os.Stdout, "Got body: %s\n", body)
		endpointSecret := "whsec_...";
  	event, err := webhook.ConstructEvent(body, req.Header.Get("Stripe-Signature"), endpointSecret)

  if err != nil {
    fmt.Fprintf(os.Stderr, "Error verifying webhook signature: %v\n", err)
    w.WriteHeader(http.StatusBadRequest) // Return a 400 error on a bad signature
    return
  }
	if event.Type == "checkout.session.completed" {
    var mySession stripe.CheckoutSession
    err = json.Unmarshal(event.Data.Raw, &mySession)
    if err != nil {
      fmt.Fprintf(os.Stderr, "Error parsing webhook JSON: %v\n", err)
      w.WriteHeader(http.StatusBadRequest)
      return
    }
		customer := mySession.CustomerDetails.Name
		address := mySession.CustomerDetails.Address.Line1
		city := mySession.CustomerDetails.Address.City
		state := mySession.CustomerDetails.Address.State
		zip := mySession.CustomerDetails.Address.PostalCode
		country := mySession.CustomerDetails.Address.Country
		phone := mySession.CustomerDetails.Phone
		email := mySession.CustomerDetails.Email
		fmt.Println("Customer: ", customer)
		fmt.Println("Address: ", address)
		fmt.Println("City: ", city)
		fmt.Println("State: ", state)
		fmt.Println("Zip: ", zip)
		fmt.Println("Country: ", country)
		fmt.Println("Phone: ", phone)
		fmt.Println("Email: ", email)

		// pretty, err := json.MarshalIndent(session, "", "    ")
		// fmt.Println("Session: ", string(pretty))
    params := &stripe.CheckoutSessionParams{}
    params.AddExpand("line_items")

    // Retrieve the session. If you require line items in the response, you may include them by expanding line_items.
    sessionWithLineItems, _ := session.Get(mySession.ID, params)
		lineItems := sessionWithLineItems.LineItems
    // Fulfill the purchase...
    FulfillOrder(lineItems)
  }

		w.WriteHeader(http.StatusOK)
	})
	http.ListenAndServe(":4242", nil)

}

// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys


