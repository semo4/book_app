'use strict';

// imports 
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const override = require('method-override');


let app = express();
app.use(cors());
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.use(override('_method'));
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
require('dotenv').config();
let pg  = require('pg');

const PORT = process.env.PORT;

// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });


app.get('/', hendleHome);
app.get('/search', hendleSearch);
// app.get('/searches/new', handleSearchPage);
app.post('/show', handleBookSearch);
app.get('/error', handleError);
app.post('/books', handlesave);
app.get('/books/:id', handleDetails);
app.post('/books/:id', handleUpdate);
app.delete('/books/:id', handleDelete);
app.put('/books/:id', handleUpdateData);


app.get('*',handleerror);
function handleerror(req, res){
    handleError(req,res);

}
function handleError(req,res){
    res.render('pages/error',{status:404, message:"Sorry some thing went wrong"});
}

function hendleHome(req, res){
    let sqlQuery = `select * from books`;
    

    client.query(sqlQuery).then(data => {

        let count = "select count(id) as total from books";
      
        client.query(count).then(total => {
           
            res.render('pages/index', {books: data.rows ,  total :total.rows});
            
        });
       
    }).catch(error =>{
       
        handleError(req,res);
    });
    
}

function hendleSearch(req, res){
    res.render('pages/searches/new');
}

function handlesave(req, res){
    let title = req.body.title;
    let author =  req.body.author;
    let description =  req.body.description;
    let image =  req.body.image;
    let isbn =  req.body.isbn;
    let sqlQuery = `insert into books(title,author, isbn, image_url, description) values ($1,$2,$3,$4,$5)returning *`;
    let value = [title,author, isbn, image, description];
    client.query(sqlQuery, value).then(data => {
        
        let lastItem = `SELECT * FROM books ORDER BY id DESC LIMIT 1`;
 
        client.query(lastItem).then(data => {
            
            res.redirect('/books/'+data.rows[0].id);
        });
        // console.log('data returned back from db ', data);
        
    });
}

function handleBookSearch(req, res){
    let searchquery = req.body.searchquery;

    let terms = req.body.select;
 
    
    let concatSearch= "+in"+terms+':'+searchquery;
  

    let defaultInmge = "https://i.imgur.com/J5LVHEL.jpg";

    const url = 'https://www.googleapis.com/books/v1/volumes';
    
    let query = {
        q : concatSearch,
        maxResults : 10
    }
    superagent.get(url).query(query).then(data =>{
        // res.status(200).send(data.body.items[0].valumeInfo);
        // console.log(data.body);

      let arrayBooks = data.body.items.map(obj =>{
        let title = obj.volumeInfo.title;
        let author = obj.volumeInfo.authors;
        let description = obj.volumeInfo.description;
        let image = obj.volumeInfo.imageLinks.thumbnail;
        // console.log('data returned back from db ', image);
        let isbn = obj.volumeInfo.industryIdentifiers;
        
        if(author === undefined){
            author = "Unkown Author";
        }
        if(description === undefined){
            description = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor repellendus officia cupiditate id esse pariatur sint! Odio, veritatis accusamus. Fugit magni, provident quo unde nulla dicta voluptatum eum saepe rem.Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor repellendus officia cupiditate id esse pariatur sint! Odio, veritatis accusamus. Fugit magni, provident quo unde nulla dicta voluptatum eum saepe rem.Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor repellendus officia cupiditate id esse pariatur sint! Odio, veritatis accusamus. Fugit magni, provident quo unde nulla dicta voluptatum eum saepe rem.Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor repellendus officia cupiditate id esse pariatur sint! Odio, veritatis accusamus. Fugit magni, provident quo unde nulla dicta voluptatum eum saepe rem.";
        }
        if(isbn===undefined){
            isbn = "00000000";
        }else{
            isbn =isbn[0].type+isbn[0].identifier;
        }
      
        if(image === undefined){
            image = defaultInmge;
            
        }
        
        image = image.replace(/^http:\/\//i, 'https://');
       

        // let sqlQuery = `insert into citylocation(c_name,display_name, lat, lon) values ($1,$2,$3,$4)returning *`;
        // let value = [searchQuery, displayName, latitude, longitude];
        // client.query(sqlQuery, value).then(data => {
        //     console.log('data returned back from db ', data);
        // });
        return new Book(title, author, description, image, isbn);
      });
 
        res.render('pages/searches/show', {books:arrayBooks });

    }).catch(error =>{
        handleError(req,res);
        

    });
}

function handleDetails(req,res){
    let id = req.params.id;
    let sqlQuery = `SELECT * FROM books WHERE id = ${id}`;
 
    client.query(sqlQuery).then(data => {
       
        res.render('pages/books/detail', {books: data.rows});
    }).catch(error =>{
        handleError(req,res);
    });
}

function handleUpdate(req, res){
    let id = req.params.id;
    let sqlQuery = `SELECT * FROM books WHERE id = ${id}`;
 
    client.query(sqlQuery).then(data => {
       
        res.render('pages/books/edit', {books: data.rows});
    }).catch(error =>{
        handleError(req,res);
    });
}

function handleDelete(req, res){
    let id = req.params.id;
    let sqlQuery = `DELETE FROM books WHERE id = ${id}`;
 
    client.query(sqlQuery).then(data => {
       
        res.redirect('/');
    }).catch(error =>{
        handleError(req,res);
    });
}

function handleUpdateData(req,res){
    let id = req.params.id;
    let title = req.body.title;
    let author =  req.body.author;
    let description =  req.body.description;
    let image =  req.body.image;
    let isbn =  req.body.isbn;
    let sqlQuery = `UPDATE books SET title=$1 ,author=$2, isbn=$3,  description=$4  WHERE id =$5`;
    let value = [title,author, isbn,  description, id];
 
    client.query(sqlQuery,value).then(data => {
        res.redirect('/books/'+id);
    }).catch(error =>{
        handleError(req,res);
    });
}



function Book(title, author, description, image,isbn){
    this.title= title;
    this.author= author;
    this.description = description;
    this.image = image;
    this.isbn = isbn;
}

client.connect().then(data => {
    app.listen(PORT, () => {
        console.log('the app is listening to ' + PORT);
    });
}).catch(error => {
    console.log('error in connect to database ' + error);
});