const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const db = require('./dbComponents/db.js');
const app = express();
const cors = require('cors');
const multer = require('multer');

const upload = multer();

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

// profesorov API

app.post('/addZadaca', upload.any(), function(req, res) {

    var bodyReq = JSON.parse(req.body.state);

    var postavkaFajla = null;
    if(req.files.length > 0) {
        postavkaFajla =  req.files[0].buffer;
    }
    
    db.Zadaca.findOne({where: {
        naziv : bodyReq.naziv
    }})
    .then(function(postojiZadaca){
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
                postavka: postavkaFajla
            }}).then(function(dodanaZadaca){
                var idDodaneZadace = dodanaZadaca[0].idZadaca;
                for(let i = 0; i < dodanaZadaca[0].brojZadataka; i++) {
                    db.Zadatak.findOrCreate({where :{
                        idZadaca : idDodaneZadace,
                        redniBrojZadatkaUZadaci : i,
                        maxBrojBodova : bodyReq.listaBodova[i]         
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
                        console.log("haha");
                        res.status(200).send();
                    })
                }   
            });
        }    
    })
    .catch(err => res.send(err));   
     
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
            idZadaca : req.params.idZadaca,
            radnja : "Azuriranje",
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

app.put('/zadaca/:idZadace', function(req,res){ // update

    var bodyReq = req.body;

    db.Zadaca.findOne({where : {
        idZadaca : req.params.idZadace
    }}).then(function(zadaca) {
        try{
            zadaca.update({
                naziv : bodyReq.naziv,
                rokZaPredaju : bodyReq.datum + " " + bodyReq.vrijeme + ":59",
            }).then(function(){
                res.status(200).send();
            })
        } catch {
            res.status(404).send();
        }    
    })

// #region Komentar prijasnjeg update
/*
    db.Zadaca.findOne({where:{
        idZadaca : req.params.idZadace
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
                db.Zadatak.findAll({where : {
                    idZadaca : updateZadaca.idZadaca
                }}).then(function(zadaci){
                    for(var i = 0; i < updateZadaca.brojZadataka; i++) {
                        zadaci[i].update({where :{
                            idZadaca : updateZadaca.idZadaca,
                            redniBrojZadatkaUZadaci : i,
                            maxBrojBodova : bodyReq.listaBodova[i],
                            brojOstvarenihBodova : 0,
                            profesorovKomentar : "",
                            datumPredaje : null,
                            statusZadatka : "neposlan",
                            sadrzajFile : null,
                            velicinaFile : null,
                            mimeTipUpdateZadatka : null             
                        }}).then(function(updateZadatak){
                            db.mimeTip.findAll({where : {
                                idZadatak : updateZadatak.idZadatak
                            }}).then(function(mimeTipovi){
                                for(var i = 0; i < updateZadatak.listaTipova.length; i++) {
                                    mimeTipovi[i].update
                                }
                            })
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
            })
        }else{
            res.send(null);
        }
    })*/
    
// #endregion   
}) 

app.delete('/zadaca/:idZadace', function(req,res){ // delete 

    db.Zadaca.destroy({where : {
        idZadaca : req.params.idZadace
    }}).then(function(brojObrisanihRedova) {
        if(brojObrisanihRedova !== 1) {
            res.status(404).send();
        } else {
            res.status(200).send();
        }
    })

});

// studentov API



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


app.listen(31911);

