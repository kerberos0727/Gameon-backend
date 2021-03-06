// Created by Alex Choi for Google Forms script

// Create a new form, then add a checkbox question, a multiple choice question,
// a page break, then a date question and a grid of questions.
const form = FormApp.create('Response Form')
var item = form.addTextItem()
item.setTitle('What is your name')

form.addTextItem()

var item = form.addTextItem()
item.setTitle('What is your phone number')

Logger.log(`Published URL: ${form.getPublishedUrl()}`)
Logger.log(`Editor URL: ${form.getEditUrl()}`)
