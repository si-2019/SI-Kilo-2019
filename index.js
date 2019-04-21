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
            datum : dajDatum(zadaca.rokZaPredaju),      // ovo treba rijesiti
            vrijeme : dajVrijeme(zadaca.rokZaPredaju),    // ovo treba rijesiti
            postavka : zadaca.postavka,  
            brojZadataka : zadaca.brojZadataka,
            sviTipoviIsti : false,            
            ukupnoBodova : zadaca.ukupnoBodova,
            sviBodoviIsti : false 
        };
        db.Zadatak.findAll({
            include: [{
              model: db.MimeTip,
              as: 'mimeTipovi',
            }],
            where: {idZadaca : req.params.idZadaca}
          }).then(function (zadaciZadace){
            var listaBodovaTMP = [];
            var listaTipovaTMP = [];

            for(let i = 0; i < zadaciZadace.length; i++) {  //prolazi kroz zadatke

                listaBodovaTMP.push(zadaciZadace[i].maxBrojBodova);
                var listaTipovaJednogZadatka = [false, false, false, false, false];
                for(let j = 0; j < zadaciZadace[i].mimeTipovi.length; j++) {    //prolazi kroz mimeTipove i-tog zadatka
                    for(let k = 0; k < 5; k++) {
                        if(mimeTipovi[k] === zadaciZadace[i].mimeTipovi[j].mimeTip) {
                            listaTipovaJednogZadatka[k] = true;
                        }
                    }    
                }
                listaTipovaTMP.push(listaTipovaJednogZadatka);
            }
            data.listaBodova = listaBodovaTMP;
            data.listaTipova = listaTipovaTMP;
            res.send(data);
        })
    })
});
/*
app.put('zadaca/:idZadace', function(req,res){ // update

    var bodyReq = req.body;

    db.Zadaca.findOne({where:{
        idZadaca : req.params.idZadaca
    }}).then(function(zadaca){
        if(zadaca){
            zadaca.update({
                naziv : bodyReq.naziv,
                brojZadataka : bodyReq.brojZadataka,
                rokZaPredaju : bodyReq.datum + " " + bodyReq.vrijeme + ":59",
                ukupnoBodova : bodyReq.ukupnoBodova,
                ukupniOstvareniBodovi : 0,
                postavka: bodyReq.postavka
            }).then(function(updateZadaca){
                var idDodaneZadace = updateZadaca[0].idZadaca;
                for(let i = 0; i < updateZadaca[0].brojZadataka; i++) {
                    db.Zadatak.update({where :{
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
                        var idDodanogZadatka = dodaniZadatak[0].idZadatak;
                        var mimeTipovi = [".pdf", ".zip", ".m", ".doc", ".txt"];
                        for(let j = 0; j < 5; j++) {    
                            if(bodyReq.listaTipova[i][j] === true) {
                                db.MimeTip.update({where: {
                                    idZadatak : idDodanogZadatka,
                                    mimeTip : mimeTipovi[j]
                                }})
                            }    
                        }  
                        res.status(200).send();
                    })
                }   
            })
        }else{
            res.send(null);
        }
    })

}) 
*/
// pomocne funkcije

function dajDatum(dateTime) {
    var godina = dateTime.getFullYear().toString();
    var mjesec = (dateTime.getMonth() + 1).toString();
    var dan = dateTime.getDate().toString();

    if(mjesec < 10) {
        mjesec = "0" + mjesec;
    }

    if(dan < 10) {
        dan = "0" + dan;
    }

    return godina + "-" + mjesec + "-" + dan;
};

function dajVrijeme(dateTime) {
    return dateTime.toString().substring(16,21);
};


app.listen(6001);

