import dotenv from "dotenv";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import querystring from "node:querystring";
import pug from "pug";
import { formatDate } from "./src/utils/formatDate.js";

dotenv.config();

const viewPath = path.join(import.meta.dirname, "src", "view");
const dataPath = path.join(import.meta.dirname, "src", "Data");
const assetsPath = path.join(import.meta.dirname, "src", "assets");

const port = process.env.APP_PORT || 8080;
const host = process.env.APP_LOCALHOST || "localhost";

const server = http.createServer((req, res) => {
  if (req.url === "/favicon.ico") {
    res.writeHead(200, { "Content-Type": "image/x-icon" });
    res.end();
    return;
  }

  if (req.url === "/assets/css/style.css") {
    const css = fs.readFileSync(path.join(assetsPath, "css", "style.css"), {
      encoding: "utf8",
    });
    res.writeHead(200, { "Content-Type": "text/css" });
    res.end(css);
    return;
  }

  if (req.url === "/") {
    if (req.method === "GET") {
      const html = pug.renderFile(path.join(viewPath, "home.pug"));
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    } else if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        const newStudent = querystring.parse(body);
        const students = JSON.parse(
          fs.readFileSync(path.join(dataPath, "students.json"), "utf8")
        );
        students.push({ name: newStudent.name, birth: newStudent.birth });
        fs.writeFileSync(
          path.join(dataPath, "students.json"),
          JSON.stringify(students, null, 2)
        );
        res.writeHead(301, { Location: "/users" });
        res.end();
      });
    }
    return;
  }

  if (req.url.startsWith("/users")) {
    const students = JSON.parse(
      fs.readFileSync(path.join(dataPath, "students.json"), "utf8")
    ).map((student) => ({
      ...student,
      birth: formatDate(student.birth),
    }));
    console.log("🚀 ~ students:", students);

    const html = pug.renderFile(path.join(viewPath, "users.pug"), { students });
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  if (req.url.startsWith("/delete")) {
    if (req.method === "POST") {
      const urlParams = new URLSearchParams(req.url.split("?")[1]);
      const name = urlParams.get("name");

      let students = JSON.parse(
        fs.readFileSync(path.join(dataPath, "students.json"), "utf8")
      );
      students = students.filter((student) => student.name !== name);
      fs.writeFileSync(
        path.join(dataPath, "students.json"),
        JSON.stringify(students, null, 2)
      );

      res.writeHead(301, { Location: "/users" });
      res.end();
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Page Not Found");
});

server.listen(port, host, () => {
  console.log(`Server listening at http://${host}:${port}`);
});
