'use strict';

// imports 
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');


let app = express();
app.use(cors());
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
require('dotenv').config();
const PORT = process.env.PORT;

app.get('/', hendleHome);
app.get('/searches/new', handleSearchPage);
app.post('/books', handleBookSearch);
app.get('*',handleerror);
function handleerror(req, res){
    res.status(404).send({status: 404, response: 'Page not found'});

}


function hendleHome(req, res){
    res.render('pages/index');
}

function handleSearchPage(req,res){
    res.render('pages/searches/new');
}

function handleBookSearch(req, res){
    let searchquery = req.body.searchquery;
    let terms = req.body.se;
    let concatSearch= searchquery +'+in'+terms;
    console.log(concatSearch);
    let defaultInmge = "https://i.imgur.com/J5LVHEL.jpg";
    const url = 'https://www.googleapis.com/books/v1/volumes';
    let query = {
        q : concatSearch,
    }
    superagent.get(url).query(query).then(data =>{
        // res.status(200).send(data.body.items[0].valumeInfo);
        // console.log(data.body);

      let arrayBooks = data.body.items.map(obj =>{
        let title = obj.volumeInfo.title;
        let author = obj.volumeInfo.authors;
        let description = obj.volumeInfo.description;
        let image = obj.volumeInfo.imageLinks.thumbnail;
        if(author === undefined){
            author = "Unkown Author";
        }
        if(description === undefined){
            description = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor repellendus officia cupiditate id esse pariatur sint! Odio, veritatis accusamus. Fugit magni, provident quo unde nulla dicta voluptatum eum saepe rem.Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor repellendus officia cupiditate id esse pariatur sint! Odio, veritatis accusamus. Fugit magni, provident quo unde nulla dicta voluptatum eum saepe rem.Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor repellendus officia cupiditate id esse pariatur sint! Odio, veritatis accusamus. Fugit magni, provident quo unde nulla dicta voluptatum eum saepe rem.Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor repellendus officia cupiditate id esse pariatur sint! Odio, veritatis accusamus. Fugit magni, provident quo unde nulla dicta voluptatum eum saepe rem.";
        }
        if(image === undefined){
            image = defaultInmge;
        }

        
        return new Book(title, author, description, image);
      });
 
        res.render('pages/searchresult', {books:arrayBooks });

    }).catch(error =>{
        res.status(500).send('Api connection error ' +error);
    });

    


}

function Book(title, author, description, image){
    this.title= title;
    this.author= author;
    this.description = description;
    this.image = image;
}
app.listen(PORT, ()=>{
    console.log('Server is running on port ', PORT);
});