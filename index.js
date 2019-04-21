const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const db = require('./dbComponents/db.js');
const app = express();
const cors = require('cors');

app.use('*', cors()); // enable cors

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'))

db.sequelize.sync({force:false}).then(() => { //force:true je da se nas dio baze uvijek iznova kreira
    console.log("Usao u bazu!");
}).catch((e) => {
    console.log("greska");
    console.log(e);
});

app.post('/addZadaca', function(req, res) {
    var bodyReq = req.body;
    
    try {
        db.Zadaca.findOne({where: {
            naziv : bodyReq.naziv
        }}).then(function(postojiZadaca){
            if(postojiZadaca) {
                res.status(201).send();
            }
            else {
                db.Zadaca.findOrCreate({where:{  
                    idPredmet : bodyReq.idPredmet,
                    naziv : bodyReq.naziv,
                    brojZadataka : bodyReq.brojZadataka,
                    rokZaPredaju : bodyReq.datum + " " + bodyReq.vrijeme + ":59",
                    ukupnoBodova : bodyReq.ukupnoBodova,
                    ukupniOstvareniBodovi : 0,
                    postavka: bodyReq.postavka,
                }}).then(function(dodanaZadaca){
                    console.log(dodanaZadaca);
                    var idDodaneZadace = dodanaZadaca[0].idZadaca;
                    for(let i = 0; i < dodanaZadaca[0].brojZadataka; i++) {
                        db.Zadatak.findOrCreate({where :{
                            idZadaca : idDodaneZadace,
                            redniBrojZadatkaUZadaci : i,
                            maxBrojBodova : bodyReq.listaBodova[i],
                            brojOstvarenihBodova : 0,
                            profesorovKomentar : "",
                            datumPredaje : null,
                            statusZadatka : "neposlan",
                            sadrzajFile : null,
                            velicinaFile : null,
                            mimeTipUpdateZadatka : null             
                        }}).then(function(dodaniZadatak){
                            console.log(dodaniZadatak);
                            var idDodanogZadatka = dodaniZadatak[0].idZadatak;
                            var mimeTipovi = [".pdf", ".zip", ".m", ".doc", ".txt"];
                            for(let j = 0; j < 5; j++) {    
                                if(bodyReq.listaTipova[i][j] === true) {
                                    db.MimeTip.findOrCreate({where: {
                                        idZadatak : idDodanogZadatka,
                                        mimeTip : mimeTipovi[j]
                                    }})
                                }    
                            }  
                            res.status(200).send();
                        })
                    }   
                });
            }    
        });   
    } catch (err) {
        res.status(404).send();
    }    
});

app.get('/getZadace', function(req, res) {
    var nizZadaca = [];
    
    db.Zadaca.findAll().then(function(zadace){
        for(let i = 0; i < zadace.length; i++) {
            nizZadaca.push({id : zadace[i].idZadaca, naziv : zadace[i].naziv});
        }
        res.type("json");
        res.end(JSON.stringify(nizZadaca));
    });
});

app.get('/getZadacaById/:idZadaca', function(req, res) {

    var data = null;
    var mimeTipovi = [".pdf", ".zip", ".m", ".doc", ".txt"];

    db.Zadaca.findOne({where:{
        idZadaca : req.params.idZadaca
    }}).then(function(zadaca){
        data = {
            idPredmet : zadaca.idPredmet,
            naziv : zadaca.naziv,
            datum : zadaca.rokZaPredaju,      // ovo treba rijesiti
            vrijeme : zadaca.rokZaPredaju,    // ovo treba rijesiti
            postavka : zadaca.postavka,  
            brojZadataka : zadaca.brojZadataka,
            sviTipoviIsti : false,            // ovo neka stoji false po defaultu jer je to samo pomagalo za profesora
            ukupnoBodova : zadaca.ukupnoBodova,
            sviBodoviIsti : false // ovo neka stoji false po defaultu jer je to samo pomagalo za profesora
        };

        db.Zadatak.findAll({where:{
            idZadaca : req.params.idZadaca
        }}).then(function (zadaciZadace){
            var listaBodovaTMP = [];
            var listaTipovaTMP = [[]];
            for(let i = 0; i < zadaciZadace.length; i++) {
                listaBodovaTMP.push(zadaciZadace[i].maxBrojBodova);
                db.MimeTip.findAll({where:{
                    idZadatak : zadaciZadace[i].idZadatak
                }}).then(function(tipoviZadatka){
                    for(let j = 0; j < tipoviZadatka.length; j++) {
                        var listaTipovaJednogZadatka = [false, false, false, false, false];
                        for(let k = 0; k < 5; k++) {
                            if(mimeTipovi[k] === tipoviZadatka[j].mimeTip) {
                                listaTipovaJednogZadatka[k] = true;
                            }
                        }    
                        listaTipovaTMP.push(listaTipovaJednogZadatka);
                    }
                    data.listaBodova = listaBodovaTMP;
                    data.listaTipova = listaTipovaTMP;
                    res.send(data);
                })
            }
        })
    })

});

app.listen(6001);