package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"text/template"
)

type Mail struct {
	Email        string `json:"email"`
	Name         string `json:"name"`
	Username     string `json:"username"`
	Password     string `json:"password"`
	Start_date   string `json:"start_date"`
	End_date     string `json:"end_date"`
	Action_url   string `json:"action_url"`
	Trial_length string `json:"trial_length"`
	License_key  string `json:"license_key"`
	License_type string `json:"license_type"`
	Card 			 string `json:"card"`
	Card_type    string `json:"card_type"`
	Card_number  string `json:"card_number"`
	Error 			string `json:"error"`
}

func main() {
	fmt.Println("Password: ", os.Getenv("PASSWORD"))
	fmt.Println("Email: ", os.Getenv("EMAIL"))
	http.Handle("/sendWelcomeMail", http.HandlerFunc(sendWelcomeMail))
	http.Handle("/sendCancelMail", http.HandlerFunc(sendCancelMail))
	http.Handle("/sendFailMail", http.HandlerFunc(sendFailMail))
	log.Println("Server is running on port 4343")
	lf, err := os.OpenFile("log.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Println("Error opening log file")
	}
	log.SetOutput(lf)
	defer lf.Close()
	log.Fatal(http.ListenAndServe(":4343", nil))
}

func sendFailMail(w http.ResponseWriter, r *http.Request) {
	log.Println("Sending Fail mail...")
	const MaxBodyBytes = int64(65536)
	defer r.Body.Close()
	r.Body = http.MaxBytesReader(w, r.Body, MaxBodyBytes)

	body, err := io.ReadAll(r.Body)
	if checkError(w, err, "Error reading request body") {
		return
	}
	mail := Mail{}
	err = json.Unmarshal(body, &mail)
	if checkError(w, err, "Error parsing request body") {
		return
	}

	htmlContent, err := os.ReadFile("mail-templates/PaymentFailed.html") // the file is inside the local directory
	if checkError(w, err, "HTML Template error") {
		return
	}
	txtContent, err := os.ReadFile("mail-templates/PaymentFailed.txt") // the file is inside the local directory
	if checkError(w, err, "TxtTemplate error") {
		return
	}
	mail.Action_url = "https://qr-builder.io/login"
	mail.Trial_length = "7"
	h := template.Must(template.New("htmlContent").Parse(string(htmlContent)))
	var htmlBody bytes.Buffer

	err = h.Execute(&htmlBody, mail)
	if checkError(w, err, "HTML Template exectution Error") {
		return
	}
	t := template.Must(template.New("txtContent").Parse(string(txtContent)))
	var txtBody bytes.Buffer
	err = t.Execute(&txtBody, mail)
	if checkError(w, err, "TXT Template exectution Error") {
		return
	}
	log.Printf("Sending Cancel Email: Email: %s, Name: %s, Username: %s\n", mail.Email, mail.Name, mail.Username)
	executeSendMail(w, mail, htmlBody, txtBody)
}

func sendCancelMail(w http.ResponseWriter, r *http.Request) {
	log.Println("Sending Cancel mail...")
	const MaxBodyBytes = int64(65536)
	defer r.Body.Close()
	r.Body = http.MaxBytesReader(w, r.Body, MaxBodyBytes)

	body, err := io.ReadAll(r.Body)
	if checkError(w, err, "Error reading request body") {
		return
	}
	mail := Mail{}
	err = json.Unmarshal(body, &mail)
	if checkError(w, err, "Error parsing request body") {
		return
	}

	htmlContent, err := os.ReadFile("mail-templates/SubCancelled.html") // the file is inside the local directory
	if checkError(w, err, "HTML Template error") {
		return
	}
	txtContent, err := os.ReadFile("mail-templates/SubCancelled.txt") // the file is inside the local directory
	if checkError(w, err, "TxtTemplate error") {
		return
	}
	mail.Action_url = "https://qr-builder.io/login"
	mail.Trial_length = "7"
	h := template.Must(template.New("htmlContent").Parse(string(htmlContent)))
	var htmlBody bytes.Buffer

	err = h.Execute(&htmlBody, mail)
	if checkError(w, err, "HTML Template exectution Error") {
		return
	}
	t := template.Must(template.New("txtContent").Parse(string(txtContent)))
	var txtBody bytes.Buffer
	err = t.Execute(&txtBody, mail)
	if checkError(w, err, "TXT Template exectution Error") {
		return
	}
	log.Printf("Sending Cancel Email: Email: %s, Name: %s, Username: %s\n", mail.Email, mail.Name, mail.Username)
	executeSendMail(w, mail, htmlBody, txtBody)
}
func sendWelcomeMail(w http.ResponseWriter, r *http.Request) {
	const MaxBodyBytes = int64(65536)
	defer r.Body.Close()
	r.Body = http.MaxBytesReader(w, r.Body, MaxBodyBytes)

	body, err := io.ReadAll(r.Body)
	if checkError(w, err, "Error reading request body") {
		return
	}
	mail := Mail{}
	err = json.Unmarshal(body, &mail)
	if checkError(w, err, "Error parsing request body") {
		return
	}
	var htmlContent []byte
	var txtContent []byte
	if mail.License_key != "" && mail.License_type != "" {
		log.Println("License key: ", mail.License_key)
		log.Println("License type: ", mail.License_type)
		htmlContent, err = os.ReadFile("mail-templates/welcomeLicense.html") // the file is inside the local directory
		if checkError(w, err, "HTML Template error") {
			return
		}
		txtContent, err = os.ReadFile("mail-templates/welcomeLicense.txt") // the file is inside the local directory
		if checkError(w, err, "TxtTemplate error") {
			return
		}
	} else {
		htmlContent, err = os.ReadFile("mail-templates/welcome.html") // the file is inside the local directory
		if checkError(w, err, "HTML Template error") {
			return
		}
		txtContent, err = os.ReadFile("mail-templates/welcome.txt") // the file is inside the local directory
		if checkError(w, err, "TxtTemplate error") {
			return
		}
	}
	mail.Action_url = "https://qr-builder.io/login"
	mail.Trial_length = "7"
	h := template.Must(template.New("htmlContent").Parse(string(htmlContent)))
	var htmlBody bytes.Buffer

	err = h.Execute(&htmlBody, mail)
	if checkError(w, err, "HTML Template exectution Error") {
		return
	}
	t := template.Must(template.New("txtContent").Parse(string(txtContent)))
	var txtBody bytes.Buffer
	err = t.Execute(&txtBody, mail)
	if checkError(w, err, "TXT Template exectution Error") {
		return
	}
	log.Printf("Sending Cancel Email: Email: %s, Name: %s, Username: %s\n", mail.Email, mail.Name, mail.Username)
	executeSendMail(w, mail, htmlBody, txtBody)
}

func executeSendMail(w http.ResponseWriter, mail Mail, htmlBody bytes.Buffer, txtBody bytes.Buffer) {
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
	headerMap["Content-Type"] = "multipart/mixed; boundary=\"qr-boundary-779\""
	headerMap["MIME-Version"] = "1.0"
	authenticate := smtp.PlainAuth("", accountName, emailApPassword, hostAddress)
	tlsConfigurations := &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         hostAddress,
	}
	conn, err := tls.Dial("tcp", fullServerAddress, tlsConfigurations)
	if checkError(w, err, "TCP Error") {
		return
	}
	newClient, err := smtp.NewClient(conn, hostAddress)
	if checkError(w, err, "SMTP Connection Error") {
		return
	}
	// Auth
	err = newClient.Auth(authenticate)
	if checkError(w, err, "SMTP Authentication Error") {
		return
	}
	// To && From
	err = newClient.Mail(yourMail)
	if checkError(w, err, "SMTP User error") {
		return
	}
	err = newClient.Rcpt(headerMap["To"])
	if checkError(w, err, "SMTP To Error") {
		return
	}
	// Data
	writer, err := newClient.Data()
	if checkError(w, err, "Data Writer Creation Error") {
		return
	}
	defer writer.Close()
	for k, v := range headerMap {
		_, err = writer.Write([]byte(fmt.Sprintf("%s: %s\r\n", k, v)))
		if checkError(w, err, "Header Write Error") {
			return
		}
	}
	boundary := "qr-boundary-779"
	writer.Write([]byte(fmt.Sprintf("\r\n--%s\r\n", boundary)))
	writer.Write([]byte("Content-Type: text/html; charset=\"utf-8\"\r\n"))
	writer.Write([]byte(fmt.Sprintf("\r\n%s", string(htmlBody.Bytes()))))

	writer.Write([]byte(fmt.Sprintf("\r\n--%s\r\n", boundary)))
	writer.Write([]byte("Content-Type: text/plain; charset=\"utf-8\"\r\n"))
	_, err = writer.Write([]byte(fmt.Sprintf("\r\n\r\n%s\r\n", string(txtBody.Bytes()))))
	if checkError(w, err, "HTML Write error") {
		return
	}
	err = writer.Close()
	if checkError(w, err, "Writer Close Error") {
		return
	}
	err = newClient.Quit()
	if checkError(w, err, "Quit Error") {
		return
	}
	w.Write([]byte("Mail sent successfully"))
	log.Println("Successful, the mail was sent!")
}

func checkError(w http.ResponseWriter, err error, message string) bool {
	if err != nil {
		log.Printf("%s: %s\n", message, err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return true
	}
	return false
}
