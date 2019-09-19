const express = require('express')
const bodyParser = require('body-parser')
const { prisma } = require('./generated/prisma-client')
const { hash, compare } = require('bcrypt')
const { sign } = require('jsonwebtoken')
const APP_SECRET = 'appsecret321'

const app = express()

app.use(bodyParser.json())

app.post(`/login`, async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user({ email })
  if (!user) {
    throw new Error(`No user found for email: ${email}`)
  }
  const passwordValid = await compare(password, user.password)
  if (!passwordValid) {
    throw new Error('Invalid password')
  }
  const result = {
    token: sign({ userId: user.id }, APP_SECRET),
    user,
  }
  res.json(result)
})

app.post(`/signup`, async (req, res) => {
  const { name, email, password, role } = req.body
  const hashedPassword = await hash(password, 10)
  const user = await prisma.createUser({
    name,
    email,
    role,
    password: hashedPassword,
  })
  const result = {
    token: sign({ userId: user.id }, APP_SECRET),
    user,
  }
  res.json(result)
})

app.post(`/createClass`, async (req, res) => {
  const { name, id_unit } = req.body
  const result = await prisma.createClass({
    name,
    units: { connect: { id: id_unit } },
  })
  res.json(result)
})

app.post(`/createUnit`, async (req, res) => {
  const { unit, id_lesson } = req.body
  const result = await prisma.createUnit({
    unit,
    lessons: { connect: { id: id_lesson } },
  })
  res.json(result)
})

app.post(`/createLesson`, async (req, res) => {
  const { title } = req.body
  const result = await prisma.createLesson({
    title
  })
  res.json(result)
})


app.get('/classes', async (req, res) => {
  const fragment = `
      fragment ClassWithUnit on Class {
        id
        name
        units {
          id
          unit
          lessons{
            id
            title
          }
        }
      }
      `
  const classes = await prisma.classes().$fragment(fragment)
  res.json(classes)
})

app.get('/filterPosts', async (req, res) => {
  const { searchString } = req.query
  const draftPosts = await prisma.posts({
    where: {
      OR: [
        {
          title_contains: searchString,
        },
        {
          content_contains: searchString,
        },
      ],
    },
  })
  res.json(draftPosts)
})

app.listen(3000, () =>
  console.log('Server is running on http://localhost:3000'),
)
