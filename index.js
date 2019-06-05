const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const db = require("./dbComponents/db.js");
const app = express();
const cors = require("cors");
const multer = require("multer");

const upload = multer();

app.use("*", cors()); // enable cors

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

db.sequelize
  .sync({ force: false })// NE MIJENJAJ NA TRUE NIKAD
  .then(() => {
    //force:true je da se nas dio baze uvijek iznova kreira
    console.log("Usao u bazu!");
  })
  .catch(e => {
    console.log("greska");
    console.log(e);
  });

// profesorov API

app.post("/addZadaca", upload.any(), function(req, res) {
  var bodyReq = JSON.parse(req.body.state);

  var postavkaFajla = null;
  var imeFajlaPostavke = null;
  var tipFajlaPostavke = null;
  if (req.files.length > 0) {
    postavkaFajla = req.files[0].buffer;
    imeFajlaPostavke = req.body.imeFajlaPostavke;
    tipFajlaPostavke = req.files[0].mimetype;
  }

  db.Zadaca.findOne({
    where: {
      naziv: bodyReq.naziv
    }
  })
    .then(function(postojiZadaca) {
      if (postojiZadaca) {
        res.status(201).send();
      } else {
        db.Zadaca.findOrCreate({
          where: {
            idPredmet: bodyReq.idPredmet,
            naziv: bodyReq.naziv,
            brojZadataka: bodyReq.brojZadataka,
            rokZaPredaju: bodyReq.datum + " " + bodyReq.vrijeme + ":59",
            ukupnoBodova: bodyReq.ukupnoBodova,
            postavka: postavkaFajla,
            imeFajlaPostavke: imeFajlaPostavke,
            tipFajlaPostavke: tipFajlaPostavke
          }
        }).then(function(dodanaZadaca) {
          var idDodaneZadace = dodanaZadaca[0].idZadaca;
          for (let i = 0; i < dodanaZadaca[0].brojZadataka; i++) {
            db.Zadatak.findOrCreate({
              where: {
                idZadaca: idDodaneZadace,
                redniBrojZadatkaUZadaci: i,
                maxBrojBodova: bodyReq.listaBodova[i]
              }
            }).then(function(dodaniZadatak) {
              var idDodanogZadatka = dodaniZadatak[0].idZadatak;
              var mimeTipovi = [".pdf", ".zip", ".m", ".doc", ".txt"];
              for (let j = 0; j < 5; j++) {
                if (bodyReq.listaTipova[i][j] === true) {
                  db.MimeTip.findOrCreate({
                    where: {
                      idZadatak: idDodanogZadatka,
                      mimeTip: mimeTipovi[j]
                    }
                  });
                }
              }
              res.status(200).send();
            });
          }
        });
      }
    })
    .catch(err => res.send(err));
});

app.post("/ocijeniZadatak", function(req, res) {
  var bodyReq = req.body;
  /*
    
    imaš bodyReq.osvojeniBodovi, bodyReq.komentar, bodyReq.prepisanZadatak (prepisanZadatak je id od switcha)

    */
   res.status(200).send();
});

app.get("/getZadace", function(req, res) {
  var nizZadaca = [];

  db.Zadaca.findAll().then(function(zadace) {
    for (let i = 0; i < zadace.length; i++) {
      nizZadaca.push({ id: zadace[i].idZadaca, naziv: zadace[i].naziv });
    }
    res.type("json");
    res.end(JSON.stringify(nizZadaca));
  });
});

app.get("/getStudenteKojimaNijePregledanaZadaca", function(req, res) {
  var nizStudenata = [
    { id: 0, naziv: "Mala Mu" },
    { id: 1, naziv: "Nekic" },
    { id: 2, naziv: "Medi" },
    { id: 3, naziv: "Haker" }
  ];

  res.type("json");
  res.end(JSON.stringify(nizStudenata));
});

app.get("/getStudenteKojiSuPoslaliZadacu", function(req, res) {
  var nizStudenata = [
    { id: 0, naziv: "Neko" },
    { id: 1, naziv: "Nekic" },
    { id: 2, naziv: "Medi" },
    { id: 3, naziv: "Haker" }
  ];

  res.type("json");
  res.end(JSON.stringify(nizStudenata));
});

app.get("/getDatoteku", function(req, res) {
    //console.log('datoteka preuzmi');
    res.status(200).send();
});

app.get("/getPregledDatoteke", function(req, res) {
    res.status(200).send();
});

app.get("/getZadacuStudenta/:idZadace/:idStudenta", function(req, res) {

  var zadaca = req.params.idZadace;
  var student = req.params.idStudenta;

  db.Zadaca.findOne({where: { idZadaca: zadaca }}).then(function(postojiZadaca) {
    
    var nizZadataka=[], nizMogucihBodova = [], nizOstvarenih = [], nizStanja = [], nizPregledano = [];
    for(var i=0;i<postojiZadaca.brojZadataka;i++){
      var pom = i+1;
      nizZadataka.push("Zadatak " + pom);
      nizMogucihBodova.push(0);
      nizOstvarenih.push(0);
      nizStanja.push(0);
      nizPregledano.push(false);
    }

    db.Zadatak.findAll({where: { idZadaca: zadaca }}).then(function(zadaci) {

      for(var i=0;i<zadaci.length;i++){
        nizMogucihBodova[zadaci[i].redniBrojZadatkaUZadaci] = zadaci[i].maxBrojBodova;
      }

      db.StudentZadatak.findAll({where: { idStudent: student }}).then(function(studentZadatak) {

        if(studentZadatak){
          for(var i = 0 ; i < studentZadatak.length ; i++){
            var indeks = -1;
            for(var j = 0 ; j < zadaci.length ; j++){
              if(studentZadatak[i].idZadatak == zadaci[j].idZadatak) indeks = zadaci[j].redniBrojZadatkaUZadaci;
            }

            if(indeks!=-1){
              nizOstvarenih[indeks] = studentZadatak[i].brojOstvarenihBodova;
              nizStanja[indeks] = studentZadatak[i].stanjeZadatka;
              if(nizStanja[indeks] == 2){ 
                nizPregledano[indeks] = false;

                //US 84
                var today = new Date();
                var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
                var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                var dateTime = date+' '+time;
                if(Date.parse(postojiZadaca.rokZaPredaju) < Date.parse(dateTime)){ nizOstvarenih[indeks] = 0;}
              }
              else nizPregledano[indeks] = true;
            }
          }

        }

        var zadacaState = {
          zadaciZadace: nizZadataka,
          postavkaZadace: postojiZadaca.imeFajlaPostavke,
          moguciBodovi: nizMogucihBodova,
          ostvareniBodovi: nizOstvarenih,
          rokZaPredaju: dajDatum(postojiZadaca.rokZaPredaju) + " " + dajVrijeme(postojiZadaca.rokZaPredaju),
          stanjeZadatakaZadace: nizStanja,
          pregledanZadatak: nizPregledano
        };
        res.send(zadacaState);
      });
    });
  });
});

app.get("/getStudenteKojiNisuPoslaliZadacu", function(req, res) {
  var nizStudenata = [
    { id: 0, naziv: "Charmander" },
    { id: 1, naziv: "Nekic" },
    { id: 2, naziv: "Medi" },
    { id: 3, naziv: "Haker" }
  ];

  res.type("json");
  res.end(JSON.stringify(nizStudenata));
});

app.get("/getZadacaById/:idZadaca", function(req, res) {
  var data = null;
  var mimeTipovi = [".pdf", ".zip", ".m", ".doc", ".txt"];

  db.Zadaca.findOne({
    where: {
      idZadaca: req.params.idZadaca
    }
  }).then(function(zadaca) {
    data = {
      idZadaca: req.params.idZadaca,
      radnja: "Azuriranje",
      idPredmet: zadaca.idPredmet,
      naziv: zadaca.naziv,
      datum: dajDatum(zadaca.rokZaPredaju),
      vrijeme: dajVrijeme(zadaca.rokZaPredaju),
      postavka: [zadaca.postavka],
      brojZadataka: zadaca.brojZadataka,
      sviTipoviIsti: false,
      ukupnoBodova: zadaca.ukupnoBodova,
      sviBodoviIsti: false
    };
    db.Zadatak.findAll({
      include: [
        {
          model: db.MimeTip,
          as: "mimeTipovi"
        }
      ],
      where: { idZadaca: req.params.idZadaca }
    }).then(function(zadaciZadace) {
      var listaBodovaTMP = [];
      var listaTipovaTMP = [];

      for (let i = 0; i < zadaciZadace.length; i++) {
        //prolazi kroz zadatke

        listaBodovaTMP.push(zadaciZadace[i].maxBrojBodova);
        var listaTipovaJednogZadatka = [false, false, false, false, false];
        for (let j = 0; j < zadaciZadace[i].mimeTipovi.length; j++) {
          //prolazi kroz mimeTipove i-tog zadatka
          for (let k = 0; k < 5; k++) {
            if (mimeTipovi[k] === zadaciZadace[i].mimeTipovi[j].mimeTip) {
              listaTipovaJednogZadatka[k] = true;
            }
          }
        }
        listaTipovaTMP.push(listaTipovaJednogZadatka);
      }
      data.listaBodova = listaBodovaTMP;
      data.listaTipova = listaTipovaTMP;
      res.send(data);
    });
  });
});

app.put("/zadaca/:idZadace", upload.any(), function(req, res) {
  // update

  var bodyReq = JSON.parse(req.body.state);

  if (req.files.length > 0 && req.files[0].mimetype !== "buffer") {
    //jest mijenjana postavka fajla
    var postavkaFajla = req.files[0].buffer;
    var imeFajlaPostavke = req.body.imeFajlaPostavke;
    var tipFajlaPostavke = req.files[0].mimetype;
    db.Zadaca.findOne({
      where: {
        idZadaca: req.params.idZadace
      }
    })
      .then(function(zadaca) {
        zadaca
          .update({
            naziv: bodyReq.naziv,
            rokZaPredaju: bodyReq.datum + " " + bodyReq.vrijeme + ":59",
            postavka: postavkaFajla,
            imeFajlaPostavke: imeFajlaPostavke,
            tipFajlaPostavke: tipFajlaPostavke
          })
          .then(function() {
            res.status(200).send();
          });
      })
      .catch(err => res.send(err));
  } else {
    // nije mijenjana postavka fajla
    db.Zadaca.findOne({
      where: {
        idZadaca: req.params.idZadace
      }
    })
      .then(function(zadaca) {
        zadaca
          .update({
            naziv: bodyReq.naziv,
            rokZaPredaju: bodyReq.datum + " " + bodyReq.vrijeme + ":59"
          })
          .then(function() {
            res.status(200).send();
          });
      })
      .catch(err => res.send(err));
  }
});

app.delete("/zadaca/:idZadace", function(req, res) {
  // delete

  db.Zadaca.destroy({
    where: {
      idZadaca: req.params.idZadace
    }
  }).then(function(brojObrisanihRedova) {
    if (brojObrisanihRedova !== 1) {
      res.status(404).send();
    } else {
      res.status(200).send();
    }
  });
});

app.get("/getImeFajla/:idZadaca", function(req, res) {
  // update

  db.Zadaca.findOne({
    where: {
      idZadaca: req.params.idZadaca
    }
  }).then(function(zadaca) {
    res.send(zadaca.imeFajlaPostavke);
  });
});

// studentov API
app.get("/dozvoljeniTipoviZadatka/:idZadatak", function(req, res) {
  
  var idZadatakk = req.params.idZadatak;
  //console.log(idZadatakk);
  if(idZadatakk!==undefined)
  db.MimeTip.findAll({
    where: {
      idZadatak: idZadatakk  }
  })
    .then(function(tipoviZadatka) {
      //console.log(tipoviZadatka);
      var nizTipova=[];
      tipoviZadatka.map(mimeTip=>{
        nizTipova.push(mimeTip.dataValues.mimeTip);
        
      });
      //console.log(nizTipova);
      res.status(200).send(nizTipova);
    });

  
  else res.status(500).send();
});

app.get("/popuniZadatakVecPoslan/:idZadatak", function(req, res) {
  var idZadatakk = req.params.idZadatak;
  if(idZadatakk!==undefined)
  db.StudentZadatak.findAll({
    where: {
      idZadatak: idZadatakk  }
  }).then(function(zadatak){
     var zad=zadatak[0].dataValues;
     var datumIVrijeme=zad.datumIVrijemeSlanja;
    var mjesec=datumIVrijeme.getMonth();
    mjesec++;
    var infoOZadatku = {
     
      datumSlanja: datumIVrijeme.getDate()+ '/'+mjesec+'/'+datumIVrijeme.getFullYear(),
      vrijemeSlanja: datumIVrijeme.toLocaleTimeString(),
      nazivFajla: zad.nazivDatoteke,
      velicinaFajla: zad.velicinaDatoteke+' MB',
      komentar: zad.komentar
    };
  
    res.status(200).send(infoOZadatku);
});
   
    else res.status(500).send();

});

app.post("/slanjeZadatka", function(req, res) {
  var nazivUploada = req.body;
  //console.log(nazivUploada);
  res.status(200).send(nazivUploada);
});

app.get("/dajZadaceZaStudenta/:idStudenta/:idPredmeta", function(req, res) {
  var student = req.params.idStudenta;
  var predmet = req.params.idPredmeta;
  console.log(predmet);

  db.Zadaca.findAll({where : {idPredmet: predmet}}).then(function(zadaca){

    var imenaZadaca = [], brojZadataka = 0, listaZadataka = [], rokoviZaPredaju = [], postavke = [], maxBodoviPoZadacima = [];
    for(var i=0;i<zadaca.length;i++){
      imenaZadaca.push(zadaca[i].naziv);
      rokoviZaPredaju.push(dajDatum(zadaca[i].rokZaPredaju) + " " + dajVrijeme(zadaca[i].rokZaPredaju));
      postavke.push(zadaca[i].imeFajlaPostavke);
      if(zadaca[i].brojZadataka>brojZadataka) brojZadataka = zadaca[i].brojZadataka; 
      

      
    }

    for(var i = 1; i<brojZadataka+1; i++){
      listaZadataka.push("Zadatak " + i);
    }

    db.Zadatak.findAll().then(function(zadaci){

      var zadaciZadace = [], bodovi = [], stanja=[];
      for(var i=0;i<zadaca.length;i++){
        var pomocni = [], pomocni2 = [];
        for(var j=0;j<zadaca[i].brojZadataka;j++){
          pomocni.push(0);
          pomocni2.push("");
        }
        if(zadaca[i].brojZadataka<brojZadataka){
          for(var k=0;k<brojZadataka-zadaca[i].brojZadataka;k++) {pomocni2.push(""); pomocni.push("");}
        }
        zadaciZadace.push(pomocni);
        bodovi.push(pomocni);
        stanja.push(pomocni2);
      }

      for(var j=0; j<zadaca.length; j++){
        for(var i=0; i<zadaci.length; i++){
          if(zadaci[i].idZadaca == zadaca[j].idZadaca){
            zadaciZadace[j][zadaci[i].redniBrojZadatkaUZadaci] = zadaci[i].maxBrojBodova;
          } 
        }
      }

      
      db.StudentZadatak.findAll({where : {idStudent : student}}).then(function(studentic){
        if(studentic){
          for(var i=0;i<zadaca.length;i++){
            for(var j=0;j<zadaci.length; j++){
              for(var k=0;k<studentic.length;k++){
                if(zadaca[i].idZadaca==zadaci[j].idZadaca && zadaci[j].idZadatak == studentic[k].idZadatak){
                  bodovi[i][zadaci[j].redniBrojZadatkaUZadaci] = studentic[k].brojOstvarenihBodova;
                  stanja[i][zadaci[j].redniBrojZadatkaUZadaci] = studentic[k].stanjeZadatka;
                }
              }
            }
          }

        }
        var data = {
          listaZadaca: imenaZadaca,
          listaZadataka: listaZadataka, //ovjde treba staviti listu zadataka od zadace koja ima najvise zadataka -- zbog kreiranja tabele
          maxBodoviPoZadacimaPoZadacama: zadaciZadace,
          bodoviPoZadacimaZadaca: bodovi,
          rokZaPredaju:rokoviZaPredaju,
          stanjeZadacaPoZadacima: stanja,
          postavka: postavke
        };
        res.status(200).send(data);
      });

      //dohvati iz baze sve info o zadacama studenta sa indeksom indeksStudenta
    });
  });
});

// pomocne funkcije

function dajDatum(dateTime) {
  var godina = dateTime.getFullYear().toString();
  var mjesec = (dateTime.getMonth() + 1).toString();
  var dan = dateTime.getDate().toString();

  if (mjesec < 10) {
    mjesec = "0" + mjesec;
  }

  if (dan < 10) {
    dan = "0" + dan;
  }

  return godina + "-" + mjesec + "-" + dan;
}

function dajVrijeme(dateTime) {
  return dateTime.toString().substring(16, 21);
}

app.listen(31911);
