
// note! some methods are using mongo, some old ones are using this backend (like app.get('/' )

// exercises 3.12. (pbmongotest)
// exercises 3.13.-3.15.
// mongodb muutoksia 
// lisätään dotenv ja filu .env johon atlasdb salasana
// models/person.js
// added errorHandling middleware


require('dotenv').config()
const express = require('express')
const Person = require('./models/person')
const morgan = require('morgan')

const app = express()
app.use(express.static('dist'))
app.use(express.json())         // use this so we can get later body = request.body

const requestLogger = (request, response, next) => {
    console.log('Method:', request.method)
    console.log('Path:  ', request.path)
    console.log('Body:  ', request.body)
    console.log('---')
    next()
}
app.use(requestLogger)

//app.use(morgan('combined'))   // one way of using morgan 
morgan.token('body', (request) => JSON.stringify(request.body))
app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms :body')
)

let persons = [
    {
        id: "1",
        name: "Arto Hellas",
        number: "555-123456"
    },
    {
        id: "2",
        name: "Ada Lovelace",
        number: "555-2353562"
    },
    {
        id: "3",
        name: "Mary Poppendleck",
        number: "555-435345"
    }
]

app.get('/', (request, response) => {
    response.send(`
    <h1>Phonebook</h1>
    <h2>Usage:</h2>
    <h2>localhost:3001</h2>
    <h2>localhost:3001/info</h2>
    <h2>localhost:3001/api/phonebook</h2>
    <h2>localhost:3001/api/phonebook/id-number`)
})

app.get('/info', (request, response) => {
    const date = new Date()
    const dateNow = date.toUTCString()
    const bookLength = persons.length
    response.send(
        `Phonebook has info for ${bookLength} people
        </br> ${dateNow}
        `)
})

// uses mongo with error middleware
app.get('/api/phonebook', (request, response) => {
    console.log('app.get from mongodb atlas')
    Person.find({}).then(persons => {
        response.json(persons)
    })
    .catch(error => next(error))
})
// app.get('/api/phonebook', (request, response) => {
//     response.json(persons)
// })

// uses mongo (with error handling)
app.get('/api/phonebook/:id', (request, response, next) => {
    console.log('app.get(api/phonebook/:id from mongo');
    Person.findById(request.params.id)
      .then(person => {
        if (person) {
          response.json(person)
        } else {
          console.log('mongo id not found')
          response.status(404).end()
        }
      })
      .catch(error => next(error))
  })
// app.get('/api/phonebook/:id', (request, response) => {
//     const id = request.params.id
//     const person = persons.find(person => person.id === id)

//     if (person) {
//         response.json(person)
//     } else {
//         response.status(404).send(`<h2>404 url id not found</h2>`)
//     }
// })

// uses mongo
app.delete('/api/phonebook/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
      .then(result => {
        response.status(204).end()
      })
      .catch(error => next(error))
  })

// delete person with url parameter
// app.delete('/api/phonebook/:id', (request, response) => {
//     const id = request.params.id
//     // find a person
//     const found = persons.filter(person => person.id === id)

//     // if found and not found
//     if (found) {
//         persons = persons.filter(person => person.id !== id)
//         response.status(204).end()
//     } else {
//         response.status(404).send(`<h2>404 url not found</h2>`)
//     }
// })

// delete person with content id
app.delete('/api/phonebook', (request, response) => {
    const body = request.body
    console.log(body)
    if (!body.id) {
        response.status(404).send(`<h2>404 DELETE message missing content</h2>`)
    } 
    // find a person
    const found = persons.filter(person => person.id === body.id)
    
    // if found and not found
    if (found) {
        // remove person from array
        persons = persons.filter(person => person.id !== body.id)
        response.status(204).end()
    } else {
        response.status(404).send(`<h2>404 id not found</h2>`)
    }
})

// uses mongo
app.post('/api/phonebook', (request, response) => {
    console.log('app.post(/api/phonebook) to mongodb atlas')
    const body = request.body
  
    if (!body.name || !body.number) {
      return response.status(400).json({ error: 'name or number missing' })
    }
  
    const person = new Person({
      name: body.name,
      number: body.number,
    })
  
    person.save().then(savedPerson=> {
      response.json(savedPerson)
    })
    .catch(error => next(error))
  })
// add a person
// app.post('/api/phonebook', (request, response) => {
//     const body = request.body

//     if (!body.name || !body.number) {
//         return response.status(400).json({
//             error: 'name andor number missing'
//         })
//     }
//     const foundByName = persons.find(person => person.name === body.name)
//     if (foundByName === undefined) {
//         const person = {
//             id: generateId(),
//             name: body.name,
//             number: body.number,
//             id: generateId()
//         }
//         persons = persons.concat(person)
//         response.json(person)
//     } else {
//         return response.status(400).json({
//             error: 'person name or number alredy in use'
//         })
//     }
// })

// uses mongo (new route)
app.put('/api/phonebook/:id', (request, response, next) => {
    const { name, number } = request.body
  
    Person.findById(request.params.id)
      .then(person => {
        if (!person) {
          return response.status(404).end()
        }
  
        person.name = name
        person.number = number
  
        return person.save().then((updatedNote) => {
          response.json(updatedNote)
        })
      })
      .catch(error => next(error))
  })

const generateId = () => {
    const maxId = persons.length > 0
      ? Math.max(...persons.map(n => Number(n.id)))
      : 0
    return String(maxId + 1)
  }

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError') {
      return response.status(400).send({ error: 'malformatted id' })
    }
  
    next(error)
}

// tämä tulee kaikkien muiden middlewarejen ja routejen rekisteröinnin jälkeen!
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// // exercises 3.9.-3.11.
// // fe: tehtiin muutoksia ks. kommentit ../puhelinluettelo_fe
// // be: lisättiiin app.use(express.static('dist')) notta dist tulee käyttöön
// // be: tehtiin puhelinluettelo_fe package.json filuun muutoksia, notta voidaan kaikki pistään gittiin
// // be: tehtiin .gitignore
// // be: tehtiin uusi projekti gittiin
// // ja renderiin ja luotiin uusi projekti
// // https://react-phonebook-yo1k.onrender.com/

// // be
// // echo "# react_phonebook" >> README.md
// // git init
// // git add README.md
// // git commit -m "first commit"
// // git branch -M main
// // git remote add origin https://github.com/JanneJMakinen/react_phonebook.git
// // git push -u origin main

// // nyt
// // git add .
// // git commit -m "jotain tähän"
// // git branch -M main
// // git push -u origin main

// // tai npm run deploy:full

// // exercises 3.7.-3.8 
// // added morgan
// // https://github.com/expressjs/morgan

// // added requestlogger

// // added unknownEndpoint (next to creating port)

// // backend phonebook

// const express = require('express')
// const morgan = require('morgan')

// const app = express()
// app.use(express.static('dist'))
// app.use(express.json())         // use this so we can get later body = request.body

// const requestLogger = (request, response, next) => {
//     console.log('Method:', request.method)
//     console.log('Path:  ', request.path)
//     console.log('Body:  ', request.body)
//     console.log('---')
//     next()
// }
// app.use(requestLogger)

// //app.use(morgan('combined'))   // one way of using morgan 
// morgan.token('body', (request) => JSON.stringify(request.body))
// app.use(
//     morgan(':method :url :status :res[content-length] - :response-time ms :body')
// )

// let persons = [
//     {
//         id: "1",
//         name: "Arto Hellas",
//         number: "555-123456"
//     },
//     {
//         id: "2",
//         name: "Ada Lovelace",
//         number: "555-2353562"
//     },
//     {
//         id: "3",
//         name: "Mary Poppendleck",
//         number: "555-435345"
//     }
// ]

// app.get('/', (request, response) => {
//     response.send(`
//     <h1>Phonebook</h1>
//     <h2>Usage:</h2>
//     <h2>localhost:3001</h2>
//     <h2>localhost:3001/info</h2>
//     <h2>localhost:3001/api/phonebook</h2>
//     <h2>localhost:3001/api/phonebook/id-number`)
// })

// app.get('/info', (request, response) => {
//     const date = new Date()
//     const dateNow = date.toUTCString()
//     const bookLength = persons.length
//     response.send(
//         `Phonebook has info for ${bookLength} people
//         </br> ${dateNow}
//         `)
// })

// app.get('/api/phonebook', (request, response) => {
//     response.json(persons)
// })

// app.get('/api/phonebook/:id', (request, response) => {
//     const id = request.params.id
//     const person = persons.find(person => person.id === id)

//     if (person) {
//         response.json(person)
//     } else {
//         response.status(404).send(`<h2>404 url id not found</h2>`)
//     }
// })

// // delete person with url parameter
// app.delete('/api/phonebook/:id', (request, response) => {
//     const id = request.params.id
//     // find a person
//     const found = persons.filter(person => person.id === id)

//     // if found and not found
//     if (found) {
//         persons = persons.filter(person => person.id !== id)
//         response.status(204).end()
//     } else {
//         response.status(404).send(`<h2>404 url not found</h2>`)
//     }
// })

// // delete person with content id
// app.delete('/api/phonebook', (request, response) => {
//     const body = request.body
//     console.log(body)
//     if (!body.id) {
//         response.status(404).send(`<h2>404 DELETE message missing content</h2>`)
//     } 
//     // find a person
//     const found = persons.filter(person => person.id === body.id)
    
//     // if found and not found
//     if (found) {
//         // remove person from array
//         persons = persons.filter(person => person.id !== body.id)
//         response.status(204).end()
//     } else {
//         response.status(404).send(`<h2>404 id not found</h2>`)
//     }
// })

// // add a person
// app.post('/api/phonebook', (request, response) => {
//     const body = request.body

//     if (!body.name || !body.number) {
//         return response.status(400).json({
//             error: 'name andor number missing'
//         })
//     }
//     const foundByName = persons.find(person => person.name === body.name)
//     if (foundByName === undefined) {
//         const person = {
//             id: generateId(),
//             name: body.name,
//             number: body.number,
//             id: generateId()
//         }
//         persons = persons.concat(person)
//         response.json(person)
//     } else {
//         return response.status(400).json({
//             error: 'person name or number alredy in use'
//         })
//     }
// })

// const generateId = () => {
//     const maxId = persons.length > 0
//       ? Math.max(...persons.map(n => Number(n.id)))
//       : 0
//     return String(maxId + 1)
//   }

// const unknownEndpoint = (request, response) => {
//     response.status(404).send({ error: 'unknown endpoint' })
// }
// app.use(unknownEndpoint)

// const PORT = process.env.PORT || 3001
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`)
// })

//// ---------------------------------------

// const express = require('express')

// const app = express()
// app.use(express.json())         // use this so we can get later body = request.body

// let persons = [
//     {
//         id: "1",
//         name: "Arto Hellas",
//         number: "555-123456"
//     },
//     {
//         id: "2",
//         name: "Ada Lovelace",
//         number: "555-2353562"
//     },
//     {
//         id: "3",
//         name: "Mary Poppendleck",
//         number: "555-435345"
//     }
// ]

// app.get('/', (request, response) => {
//     response.send(`
//     <h1>Phonebook</h1>
//     <h2>Usage:</h2>
//     <h2>localhost:3001</h2>
//     <h2>localhost:3001/info</h2>
//     <h2>localhost:3001/api/phonebook</h2>
//     <h2>localhost:3001/api/phonebook/id-number`)
// })

// app.get('/info', (request, response) => {
//     const date = new Date()
//     const dateNow = date.toUTCString()
//     const bookLength = persons.length
//     response.send(
//         `Phonebook has info for ${bookLength} people
//         </br> ${dateNow}
//         `)
// })

// app.get('/api/phonebook', (request, response) => {
//     response.json(persons)
// })

// app.get('/api/phonebook/:id', (request, response) => {
//     const id = request.params.id
//     const person = persons.find(person => person.id === id)

//     if (person) {
//         response.json(person)
//     } else {
//         response.status(404).send(`<h2>404 url id not found</h2>`)
//     }
// })

// // delete person with url parameter
// app.delete('/api/phonebook/:id', (request, response) => {
//     const id = request.params.id
//     // find a person
//     const found = persons.filter(person => person.id === id)

//     // if found and not found
//     if (found) {
//         persons = persons.filter(person => person.id !== id)
//         response.status(204).end()
//     } else {
//         response.status(404).send(`<h2>404 url not found</h2>`)
//     }
// })

// // delete person with content id
// app.delete('/api/phonebook', (request, response) => {
//     const body = request.body
//     console.log(body)
//     if (!body.id) {
//         response.status(404).send(`<h2>404 DELETE message missing content</h2>`)
//     } 
//     // find a person
//     const found = persons.filter(person => person.id === body.id)
    
//     // if found and not found
//     if (found) {
//         // remove person from array
//         persons = persons.filter(person => person.id !== body.id)
//         response.status(204).end()
//     } else {
//         response.status(404).send(`<h2>404 id not found</h2>`)
//     }
// })

// // add a person
// app.post('/api/phonebook', (request, response) => {
//     const body = request.body

//     if (!body.name || !body.number) {
//         return response.status(400).json({
//             error: 'name andor number missing'
//         })
//     }
//     const foundByName = persons.find(person => person.name === body.name)
//     if (foundByName === undefined) {
//         const person = {
//             id: generateId(),
//             name: body.name,
//             number: body.number,
//             id: generateId()
//         }
//         persons = persons.concat(person)
//         response.json(person)
//     } else {
//         return response.status(400).json({
//             error: 'person name or number alredy in use'
//         })
//     }
// })

// const generateId = () => {
//     const maxId = persons.length > 0
//       ? Math.max(...persons.map(n => Number(n.id)))
//       : 0
//     return String(maxId + 1)
//   }

// const PORT = 3001
// app.listen(PORT, () => {
//     console.log(`Server runnig on port ${PORT}`)
// })

// //// ---------------------------------------
// backend with Express
// const express = require('express')
// const app = express()

// let persons = [
//     {
//         id: "1",
//         name: "Arto Hellas",
//         number: "555-123456"
//     },
//     {
//         id: "2",
//         name: "Ada Lovelace",
//         number: "555-2353562"
//     },
//     {
//         id: "3",
//         name: "Mary Poppendleck",
//         number: "555-435345"
//     },
//     {
//         id: "666",
//         name: "Test Person",
//         number: "555-555"
//     }
// ]

// app.get('/', (request, response) => {
//     response.send(`
//     <h1>Phonebook</h1>
//     <h2>Usage:</h2>
//     <h2>localhost:3001</h2>
//     <a href="localhost:3001/info">localhost:3001/info</a>
//     <h2>localhost:3001/info</h2>
//     <h2>localhost:3001/api/phonebook</h2>
//     <h2>localhost:3001/api/phonebook/id-number`)
// })

// app.get('/info', (request, response) => {
//     const date = new Date()
//     const dateNow = date.toUTCString()
//     const bookLength = persons.length
//     response.send(`Phonebook has info for ${bookLength} people
//     </br> </br> ${dateNow}`)
// })

// app.get('/api/phonebook', (request, response) => {
//     response.json(persons)
// })

// app.get('/api/phonebook/:id', (request, response) => {
//     const id = request.params.id
//     const phoneNumber = persons.find(pnumber => pnumber.id === id)

//     if (phoneNumber) {
//         response.json(phoneNumber)
//     } else {
//         response.status(404).send(`<h1>404 id not found</h1>`)
//     }
// })

// app.delete('/api/phonebook/:id', (request, response) => {
//     const id = request.params.id
//     phoneNumber = persons.filter(pnumber => pnumber.id === id)
//     response.status(204).end()
// })

// const PORT = 3001
// app.listen(PORT, () => {
//     console.log(`Server runnig on port ${PORT}`)
// })


//// ---------------------------------------
//// basic backend with HTTP

// const http = require('http')

// let phonebook = [
//     {
//         id: "1",
//         name: "Arto Hellas",
//         number: "555-123456"
//     },
//     {
//         id: "2",
//         name: "Ada Lovelace",
//         number: "555-2353562"
//     },
//     {
//         id: "3",
//         name: "Mary Poppendleck",
//         number: "555-435345"
//     }
// ]

// const app = http.createServer((request, response) => {
//     response.writeHead(200, { 'Content-Type': 'application/json' })
//     response.end(JSON.stringify(phonebook))
// })

// const PORT = 3001
// app.listen(PORT)
// console.log(`Server running on port ${PORT}`)
