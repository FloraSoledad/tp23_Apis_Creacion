const path = require('path');
const db = require('../database/models');
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const moment = require("moment");
const { AsyncLocalStorage } = require('async_hooks');

//Aqui tienen otra forma de llamar a cada uno de los modelos
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;


const moviesController = {
list: async (req, res) => {
    try {
    let { order = "id" } = req.query;
    let orders = ["id", "title", "rating", "awards", "release_date"];

    if (!order.includes(order)) {
        throw new Error(
        `El campo ${order} no existe. Campos admitidos: ['id', 'title', 'rating', 'awards', 'release_date']`
        );
    }
    let movies = await db.Movie.findAll({
        include: [
        {
            association: "genre",
            attributes: ["name"],
        },
        ],
        order: [order],
        attributes: {
        exclude: ["created_ad", "update_at"],
        },
    });
    if (movies.length) {
        return res.status(200).json({
        ok: true,
        meta: {
            total: movies.length,
        },
        data: movies,
        });
    }
    throw new Error(/* {
                            ok : false,
                            message : 'Ups, hubo un error' 
                        } */);
    } catch (error) {
    console.log(error);
    return res.status(error.status || 500).json({
        ok: false,
        msg: error.message ? error.message: "Comuniquese con el administrador de sitio",
    });
    }
},
detail: async (req, res) => {
        let error;

    try {

        if (isNaN(req.params.id)){
            error = new Error ('Upps, la pelicula no esxiste')
            error.status = 403;
            throw error;
        }
        
        let movie = await db.Movie.findByPk(req.params.id, {
            include : [{
                    all: true /* cuando son muchas ,me trae todas la asociaciones que tiene la pelicula  */
                }],   
        });
        if (movie) {
            return res.status(200).json({
            ok: true,
            meta: {
                total: 1,
            },
            data: movie
            });
        }
        error = new Error('Upps, la pelicula no esxiste');
        error.status = 403; /* el numero 403 indica no esta disponible */
        throw error;

    } catch (error) {
    console.log(error);
    return res.status(error.status || 500).json({
        ok: false,
        msg: error.message ? error.message: "Comuniquese con el administrador de sitio",
    });
    }
},
new: async (req, res) => {

try {
    let movies = await db.Movie.findAll({
        order: [["release_date", "DESC"]],
        limit: req.query.limit || 5
    });

    if (movie.length) { 
        return res.status(200).json({
        ok: true,
        meta: {
            total: movies.length
        },
        data: movies
        });
    };

    error = new Error ('Upps, no hay peliculas')
    error.status = 403;
    throw error;

 } catch (error) {
    console.log(error);
    return res.status(error.status || 500).json({
        ok: false,
        msg: error.message ? error.message: "Comuniquese con el administrador de sitio"
         });
    }
},
recomended: (req, res) => {
    db.Movie.findAll({
    include: ["genre"],
    where: {
        rating: { [db.Sequelize.Op.gte]: 8 },
    },
    order: [["rating", "DESC"]],
    }).then((movies) => {
    res.render("recommendedMovies.ejs", { movies });
    });
},
//Aqui dispongo las rutas para trabajar con el CRUD
add: function (req, res) {
    let promGenres = Genres.findAll();
    let promActors = Actors.findAll();

    Promise.all([promGenres, promActors])
    .then(([allGenres, allActors]) => {
        return res.render(path.resolve(__dirname, "..", "views", "moviesAdd"), {
        allGenres,
        allActors,
        });
    })
    .catch((error) => res.send(error));
},
create: function (req, res) {
    Movies.create({
    title: req.body.title,
    rating: req.body.rating,
    awards: req.body.awards,
    release_date: req.body.release_date,
    length: req.body.length,
    genre_id: req.body.genre_id,
    })
    .then(() => {
        return res.redirect("/movies");
    })
    .catch((error) => res.send(error));
},
edit: function (req, res) {
    let movieId = req.params.id;
    let promMovies = Movies.findByPk(movieId, { include: ["genre", "actors"] });
    let promGenres = Genres.findAll();
    let promActors = Actors.findAll();
    Promise.all([promMovies, promGenres, promActors])
    .then(([Movie, allGenres, allActors]) => {
        Movie.release_date = moment(Movie.release_date).format("L");
        return res.render(
        path.resolve(__dirname, "..", "views", "moviesEdit"),
        { Movie, allGenres, allActors }
        );
    })
    .catch((error) => res.send(error));
},
update: function (req, res) {
    let movieId = req.params.id;
    Movies.update(
    {
        title: req.body.title,
        rating: req.body.rating,
        awards: req.body.awards,
        release_date: req.body.release_date,
        length: req.body.length,
        genre_id: req.body.genre_id,
    },
    {
        where: { id: movieId },
    }
    )
    .then(() => {
        return res.redirect("/movies");
    })
    .catch((error) => res.send(error));
},
delete: function (req, res) {
    let movieId = req.params.id;
    Movies.findByPk(movieId)
    .then((Movie) => {
        return res.render(
        path.resolve(__dirname, "..", "views", "moviesDelete"),
        { Movie }
        );
    })
    .catch((error) => res.send(error));
},
destroy: function (req, res) {
    let movieId = req.params.id;
    Movies.destroy({ where: { id: movieId }, force: true }) // force: true es para asegurar que se ejecute la acción
    .then(() => {
        return res.redirect("/movies");
    })
    .catch((error) => res.send(error));
},
};

module.exports = moviesController;
