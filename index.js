import express from "express"
import Database from "better-sqlite3"

const app = express()

const db = Database("database.sqlite3")

db.exec("CREATE TABLE IF NOT EXISTS quotes (author text, source text, folder text, quote text, date text)")

const selectQuotes = db.prepare("SELECT *, rowid FROM quotes ORDER BY date")
const insertQuotes = db.prepare(
    "INSERT INTO quotes (author, source, folder, quote, date) values ($author, $source, $folder, $quote, date())"
)
const deleteQuotes = db.prepare("DELETE FROM quotes WHERE rowid = ?")

app.use(express.urlencoded({ extended: true }))

const renderPage = ({ quotes }) => `
<!DOCTYPE html>
<html>
<head>
  <title>Цитаты</title>
  <style>
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background: #f7f9fc;
  color: #333;
  line-height: 1.6;
}

.new-quote {
  background: #ffffff;
  margin: 20px auto;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

.new-quote label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
}

.new-quote input[type="text"],
.new-quote textarea {
  width: calc(100% - 20px);
  margin-top: 5px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.new-quote textarea {
  height: 100px;
  resize: vertical;
}

.new-quote input[type="submit"] {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

.new-quote input[type="submit"]:hover {
  background: #0056b3;
}

.quotes {
  margin: 20px auto;
  max-width: 800px;
}

.quote {
  background: white;
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.quote .date {
  font-size: 12px;
  color: #666;
  position: absolute;
  top: 15px;
  right: 15px;
}

.quote .folder {
  font-size: 14px;
  font-weight: bold;
  color: #0056b3;
  margin-bottom: 5px;
}

.quote .source {
  font-size: 14px;
  font-style: italic;
  color: #555;
  margin-bottom: 10px;
}

.quote .quote {
  font-size: 16px;
  font-weight: normal;
  color: #333;
}

.delete {
  margin-top: 10px;
}

.delete input[type="submit"] {
  background: #dc3545;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.delete input[type="submit"]:hover {
  background: #a71d2a;
}

.hidden {
  display: none;
}
  </style>
</head>
<body>
  <form action="/quotes" method="post" class="new-quote">
    <label>Автор <input type="text" name="author" placeholder="Неизвестен" /></label>
    <label>Источник <input type="text" name="source" placeholder="Неизвестно" /></label>
    <label>Папка <input type="text" name="folder" placeholder="Общее" /></label>
    <textarea name="quote" required></textarea>
    <input type="submit" value="Сохранить" />
  </form>
  <div class="quotes">
    ${quotes
        .map(
            (quote) => `
        <div class="quote">
            <div class="date">${quote.date}</div>
            <div class="folder">${quote.folder}</div>
            <div class="source">${quote.author} - ${quote.source}</div>
            <div class="quote">${quote.quote}</div>
            <form action="/delete" method="post" class="delete">
                <input type="number" name="id" value="${quote.rowid}" class="hidden">
                <input type="submit" value="Удалить">
            </form>
        </div>
    `
        )
        .join("\n")}
  </div>
</body>
</html>
`

app.get("/", (req, res) => {
    const quotes = selectQuotes.all()

    res.setHeader("Content-Type", "text/html")
    res.send(renderPage({ quotes }))
})

app.post("/quotes", (req, res) => {
    let { author, folder, source, quote } = req.body
    author = author || "Неизвестен"
    folder = folder || "Общее"
    source = source || "Неизвестно"
    insertQuotes.run({ author, folder, source, quote })

    res.setHeader("Location", "/")
    res.sendStatus(303)
})

app.post("/delete", (req, res) => {
    const { id } = req.body

    deleteQuotes.run(id)

    res.setHeader("Location", "/")
    res.sendStatus(303)
})

app.listen(3000)
