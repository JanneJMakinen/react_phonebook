// testing atlasdb
// adding phonebook entries

// usage node pbmongontest.js atlasdbpassword 

const mongoose = require('mongoose')

if (process.argv.length < 3) {
    console.log('give password as argument')
    process.exit(1)
}

const password = process.argv[2]
const url = `mongodb+srv://fullstack:${password}@cluster0.xt6ms5e.mongodb.net/phonebookApp?retryWrites=true&w=majority&appName=Cluster0`

mongoose.set('strictQuery', false)
mongoose.connect(url)

const phonebookSchema = new mongoose.Schema({
    name: String,
    number: String,
})

const Person = mongoose.model('Person', phonebookSchema)

const person = new Person({
    name: 'JanneJii',
    number: '050-23452',
})

person.save().then(result => {
    console.log('phonebook person saved!')
    //mongoose.connection.close()
})

Person.find({}).then(result => {
    console.log('fetching data from atlas db')
    result.forEach(person => {
        console.log(person)
    })
    mongoose.connection.close()
})
