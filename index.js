"use strict"

const input = "application.txt"
const output = "application.java"
const className = "Application"

const srcFile = require("fs").createReadStream(input)
const dstFile = require("fs").createWriteStream(output)

const wFileFn = (chunk = "", ...more) => {
  dstFile.write(chunk)
  more.forEach((el) => {
    dstFile.write(" " + el)
  })
  dstFile.write("\r\n")
}

const lineReader = require("readline").createInterface({
  input: srcFile,
})

wFileFn("public class "+className+" {")
wFileFn("")

lineReader.on("line", function (line) {
  let [nullable, field, srcType] = line.toLowerCase().split(/\s+/g)
  let [type, ...size] = srcType.split(/[\(\)\,]/g).filter((e) => e !== "")

  let annoArr = []
  if (nullable === "m") annoArr.push(annotation.notNull(field))
  else if (nullable === "o") annoArr.push("/*Nullable*/")
  else annoArr.push("/*Manual Review : Conditional Nullable*/")

  let javaType = "Object"
  if (type === "varchar2") {
    annoArr.push(annotation.size(size[0], field))
    javaType = "String"
  } else if (type === "number" && size.length < 2) {
    javaType = "Long"
  } else if (type === "number" && size.length === 2) {
    annoArr.push(annotation.digits(size, field))
    javaType = "Double"
  } else {
    annoArr.push("/*Manual Review : unsure type " + srcType + "*/")
  }

  annoArr.forEach((anno) => {
    wFileFn(anno)
  })
  wFileFn(javaType, camelCase(field) + ";")
  wFileFn()
})

lineReader.on("close", function () {
  dstFile.end("}")
})

//-----------------------------------------------------//

const annotation = {
  size: (max, field) =>
    `@Size(max = ${max}, message = "[${field}] must be no more than ${max} characters")`,
  notNull: (field) => `@NotNull(message = "[${field}] must not be null")`,
  digits: (size, field) => {
    const [all, frac] = size
    let int = all - frac
    const format = "#".repeat(int) + "." + "#".repeat(frac)
    return `@Digits(integer = ${int}, fraction = ${frac},message = "[${field}] must in format (${format})")`
  },
}

const camelCase = function (str) {
  return str
    .replace(/[-_]/g, " ")
    .replace(/\s(.)/g, ($1) => $1.toUpperCase())
    .replace(/\s/g, "")
    .replace(/^(.)/, ($1) => $1.toLowerCase())
}
