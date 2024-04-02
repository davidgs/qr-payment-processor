package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"strings"
	"time"
)

type Mail struct {
	Email      string `json:"email"`
	Name 	string `json:"name"`
	Username string `json:"username"`
	Password string `json:"password"`

}

func main() {
	http.Handle("/sendMail", http.HandlerFunc(sendMail))
	fmt.Println("Server is running on port 4343")
	log.Fatal(http.ListenAndServe(":4343", nil))
}

func sendMail(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Sending mail...")
	htmlContent, err := os.ReadFile("content.html")     // the file is inside the local directory
    if err != nil {
        fmt.Println("Err")
    }

	const MaxBodyBytes = int64(65536)
	defer r.Body.Close()
	r.Body = http.MaxBytesReader(w, r.Body, MaxBodyBytes)

	body, err := io.ReadAll(r.Body)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading request body: %v\n", err)
		w.WriteHeader(http.StatusServiceUnavailable)
		return
	}
	fmt.Println("Message: ", string(body))
	mail := Mail{}
	err = json.Unmarshal(body, &mail)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	htmlContent = []byte(strings.Replace(string(htmlContent), "{{name}}", mail.Name, -1))
	htmlContent = []byte(strings.Replace(string(htmlContent), "{{username}}", mail.Username, -1))
	htmlContent = []byte(strings.Replace(string(htmlContent), "{{password}}", mail.Password, -1))
	htmlContent = []byte(strings.Replace(string(htmlContent), "{{trial_length}}", "7", -1))
	htmlContent = []byte(strings.Replace(string(htmlContent), "{{trial_start_date}}", time.Now().Local().String(), -1))
	htmlContent = []byte(strings.Replace(string(htmlContent), "{{trial_end_date}}", time.Now().Local().AddDate(0, 0, 7).String(), -1))
	emailApPassword := os.Getenv("PASSWORD")
	accountName := os.Getenv("EMAIL")
	yourMail := fmt.Sprintf("QR Builder Accounts <%s>", accountName)
	hostAddress := "mail.qr-builder.io"
	hostPort := "465"
	fullServerAddress := hostAddress + ":" + hostPort
	headerMap := make(map[string]string)
	headerMap["To"] = mail.Email
	headerMap["From"] = fmt.Sprintf("QR Builder Accounts <%s>", accountName)
	headerMap["Subject"] = "QR Builder Account"
	headerMap["Content-Type"] = "text/html; charset=\"utf-8\""
	mailMessage := ""
	for k, v := range headerMap {
		mailMessage += fmt.Sprintf("%s: %s\\r\\n", k, v)
		fmt.Println(mailMessage)
	}
	mailMessage += "\\r\\n\\r\\n" + string(htmlContent)
	authenticate := smtp.PlainAuth("", accountName, emailApPassword, hostAddress)
	tlsConfigurations := &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         hostAddress,
	}
	conn, err := tls.Dial("tcp", fullServerAddress, tlsConfigurations)
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	newClient, err := smtp.NewClient(conn, hostAddress)
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// Auth
	if err = newClient.Auth(authenticate); err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// To && From
	if err = newClient.Mail(yourMail); err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err = newClient.Rcpt(headerMap["To"]); err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// Data
	writer, err := newClient.Data()
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	for k, v := range headerMap {
		_, err = writer.Write([]byte(fmt.Sprintf("%s: %s\r\n", k, v)))
		if err != nil {
			fmt.Println(err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	_, err = writer.Write([]byte(fmt.Sprintf("\r\n\r\n%s\r\n", string(htmlContent))))
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = writer.Close()
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = newClient.Quit()
	if err != nil {
		fmt.Println(err)
		fmt.Println("THERE WAS AN ERROR")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write([]byte("Mail sent successfully"))
	w.WriteHeader(http.StatusOK)
	fmt.Println("Successful, the mail was sent!")
}
