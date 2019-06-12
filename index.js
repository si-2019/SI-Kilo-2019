const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const db = require("./dbComponents/db.js");
const app = express();
const cors = require("cors");
const multer = require("multer");

const upload = multer();

const PORT = process.env.PORT || 31911;

app.use("*", cors()); // enable cors

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

db.sequelize
  .sync({ force: false }) // NE MIJENJAJ NA TRUE NIKAD
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
      naziv : bodyReq.naziv,
      idPredmet : bodyReq.idPredmet
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

app.post("/ocijeniZadatak", upload.any(), function(req, res) {
  var info = req.body;
  console.log(info);
  db.StudentZadatak.findOne({
    where: { idZadatak: info.idZadatak }
  }).then(function(trazeniRed) {
    trazeniRed.update({
      komentar: info.komentar,
      stanjeZadatka: info.stanjeZadatka,
      brojOstvarenihBodova: info.osvojeniBodovi
    });
    //console.log(trazeniRed);
    //trazeniRed.update()
  });

  /*
    bodyReq.stanjeZadatka
    imaš bodyReq.osvojeniBodovi, bodyReq.komentar, bodyReq.prepisanZadatak (prepisanZadatak je id od switcha)

    */
  res.status(200).send();
});

app.get("/getZadace/:idPredmet", function(req, res) {
  var nizZadaca = [];
  db.Zadaca.findAll({where:{
    idPredmet : req.params.idPredmet
  }})
  .then(function(zadace) {
    for (let i = 0; i < zadace.length; i++) {
      nizZadaca.push({ id: zadace[i].idZadaca, naziv: zadace[i].naziv });
    }
    res.type("json");
    res.end(JSON.stringify(nizZadaca));
  });
});
app.get("/getZadaceZaOcjenjivanje/:idPredmeta", function(req, res) {
  var predmet = req.params.idPredmeta;
  var nizZadaca = [];

  db.Zadaca.findAll({where : {idPredmet : predmet}}).then(function(zadace) {
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;

    for (let i = 0; i < zadace.length; i++) {
      if(Date.parse(zadace[i].rokZaPredaju) > Date.parse(dateTime)){ 
        nizZadaca.push({ id: zadace[i].idZadaca, naziv: zadace[i].naziv });
      }
    }
    res.type("json");
    res.end(JSON.stringify(nizZadaca));
  });
});
app.get("/getStudenteKojimaNijePregledanaZadaca/:idZadace", function(req, res) {
  var zadaca = req.params.idZadace;
  var studentiNisuPoslali = [];
  db.Zadatak.findAll({where: {idZadaca : zadaca}}).then(function(zadaci){
    if(zadaci){
      db.StudentZadatak.findAll().then(function(studenti){
        if(studenti){
          for(var i = 0; i<nizStudenata.length; i++){
            var brojPregledanihZaStudenta = 0;
            for(var j=0; j<studenti.length; j++){
              if(studenti[j].idStudent == nizStudenata[i].id){
                for(var k = 0; k<zadaci.length; k++){
                  if(zadaci[k].idZadatak == studenti[j].idZadatak && studenti[j].stanjeZadatka!=1) brojPregledanihZaStudenta = brojPregledanihZaStudenta + 1;
                }
              }
            }
            console.log(nizStudenata[i].naziv, brojPregledanihZaStudenta, zadaci.length);
            if(brojPregledanihZaStudenta != 0 && brojPregledanihZaStudenta != zadaci.length) studentiNisuPoslali.push(nizStudenata[i]);
          }
        }
        res.type("json");
        res.end(JSON.stringify(studentiNisuPoslali));
      });
    }
  });
});


app.get("/getStudenteKojiSuPoslaliZadacu/:idZadace", function(req, res) {
  
  //Studenti kojima su svi zadaci pregledani!!
  var zadaca = req.params.idZadace;
  var studentiKojimaJePregledano = [];
  db.Zadatak.findAll({where: {idZadaca : zadaca}}).then(function(zadaci){
    if(zadaci){
      db.StudentZadatak.findAll().then(function(studenti){
        if(studenti){
          for(var i = 0; i<nizStudenata.length; i++){
            var brojPregledanihZaStudenta = 0;
            for(var j=0; j<studenti.length; j++){
              if(studenti[j].idStudent == nizStudenata[i].id){
                for(var k = 0; k<zadaci.length; k++){
                  if(zadaci[k].idZadatak == studenti[j].idZadatak && studenti[j].stanjeZadatka!=1) brojPregledanihZaStudenta = brojPregledanihZaStudenta + 1;
                }
              }
            }
            console.log(nizStudenata[i].naziv, brojPregledanihZaStudenta, zadaci.length);
            if(brojPregledanihZaStudenta == zadaci.length) studentiKojimaJePregledano.push(nizStudenata[i]);
          }
        }
        
        res.type("json");
        res.end(JSON.stringify(studentiKojimaJePregledano));
      });
    }
  });
});
/*
app.get("/getDatoteku", function(req, res) {
  res.status(200).send();
});

app.get("/getPregledDatoteke", function(req, res) {
  res.status(200).send();
});
*/
app.get("/getZadacuStudenta/:idZadace/:idStudenta", function(req, res) {
  var zadaca = req.params.idZadace;
  var student = req.params.idStudenta;
  db.Zadaca.findOne({ where: { idZadaca: zadaca } }).then(function(
    postojiZadaca
  ) {
    var nizZadataka = [],
      nizMogucihBodova = [],
      nizOstvarenih = [],
      nizStanja = [],
      nizPregledano = [],
      nizidZadaciZadace = [];
    for (var i = 0; i < postojiZadaca.brojZadataka; i++) {
      var pom = i + 1;
      nizZadataka.push("Zadatak " + pom);
      nizMogucihBodova.push(0);
      nizOstvarenih.push(0);
      nizStanja.push(0);
      nizPregledano.push(false);
      nizidZadaciZadace.push("");
    }
    db.Zadatak.findAll({ where: { idZadaca: zadaca } }).then(function(zadaci) {
      for (var i = 0; i < zadaci.length; i++) {
        nizMogucihBodova[zadaci[i].redniBrojZadatkaUZadaci] =
          zadaci[i].maxBrojBodova;
        nizidZadaciZadace[zadaci[i].redniBrojZadatkaUZadaci] =
          zadaci[i].idZadatak;
      }
      db.StudentZadatak.findAll({ where: { idStudent: student } }).then(
        function(studentZadatak) {
          if (studentZadatak) {
            for (var i = 0; i < studentZadatak.length; i++) {
              var indeks = -1;
              for (var j = 0; j < zadaci.length; j++) {
                if (studentZadatak[i].idZadatak == zadaci[j].idZadatak)
                  indeks = zadaci[j].redniBrojZadatkaUZadaci;
              }
              if (indeks != -1) {
                nizOstvarenih[indeks] = studentZadatak[i].brojOstvarenihBodova;
                nizStanja[indeks] = studentZadatak[i].stanjeZadatka;
                if (nizStanja[indeks] == 2) {
                  nizPregledano[indeks] = false;
                  var today = new Date();
                  var date =
                    today.getFullYear() +
                    "-" +
                    (today.getMonth() + 1) +
                    "-" +
                    today.getDate();
                  var time =
                    today.getHours() +
                    ":" +
                    today.getMinutes() +
                    ":" +
                    today.getSeconds();
                  var dateTime = date + " " + time;
                  if (
                    Date.parse(postojiZadaca.rokZaPredaju) <
                    Date.parse(dateTime)
                  ) {
                    //nizOstvarenih[indeks] = 0;
                  }
                } else nizPregledano[indeks] = true;
              }
            }
          }
          var zadacaState = {
            zadaciZadace: nizZadataka,
            postavkaZadace: postojiZadaca.imeFajlaPostavke,
            moguciBodovi: nizMogucihBodova,
            ostvareniBodovi: nizOstvarenih,
            rokZaPredaju:
              dajDatum(postojiZadaca.rokZaPredaju) +
              " " +
              dajVrijeme(postojiZadaca.rokZaPredaju),
            stanjeZadatakaZadace: nizStanja,
            pregledanZadatak: nizPregledano,
            idZadatakaZadace: nizidZadaciZadace
          };
          res.send(zadacaState);
        }
      );
    });
  });
});

var nizStudenata = [
  { id: 0, naziv: "Edina Kovaè" },
  { id: 1, naziv: "Medina Daciæ" },
  { id: 2, naziv: "Petar Pejoviæ" },
  { id: 3, naziv: "Din Bostandžiæ" },
  { id: 4, naziv: "Irfan Duzan" }
];

app.get("/getStudenteKojiNisuPoslaliZadacu/:idZadace", function(req, res) {

  var zadaca = req.params.idZadace;
  var studentiNisuPoslali = [];
  
  db.Zadatak.findAll({where: {idZadaca : zadaca}}).then(function(zadaci){
    if(zadaci){
      db.StudentZadatak.findAll().then(function(studenti){
        if(studenti){
          for(var i = 0; i<nizStudenata.length; i++){
            var brojPregledanihZaStudenta = 0;
            for(var j=0; j<studenti.length; j++){
              if(studenti[j].idStudent == nizStudenata[i].id){
                for(var k = 0; k<zadaci.length; k++){
                  if(zadaci[k].idZadatak == studenti[j].idZadatak && studenti[j].stanjeZadatka!=1) brojPregledanihZaStudenta = brojPregledanihZaStudenta + 1;
                }
              }
            }
            console.log(nizStudenata[i].naziv, brojPregledanihZaStudenta, zadaci.length);
            if(brojPregledanihZaStudenta == 0) studentiNisuPoslali.push(nizStudenata[i]);
          }
        }
        res.type("json");
        res.end(JSON.stringify(studentiNisuPoslali));
      });
    }
  });
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
  if (idZadatakk !== undefined)
    db.MimeTip.findAll({
      where: {
        idZadatak: idZadatakk
      }
    }).then(function(tipoviZadatka) {
      //console.log(tipoviZadatka);
      var nizTipova = [];
      tipoviZadatka.map(mimeTip => {
        nizTipova.push(mimeTip.dataValues.mimeTip);
      });
      //console.log(nizTipova);
      res.status(200).send(nizTipova);
    });
  else res.status(500).send();
});

app.get("/popuniZadatakVecPoslan/:idZadatak", function(req, res) {
  var idZadatakk = req.params.idZadatak;
  if (idZadatakk !== undefined)
    db.StudentZadatak.findAll({
      where: {
        idZadatak: idZadatakk
      }
    }).then(function(zadatak) {
      var zad = zadatak[0].dataValues;
      var datumIVrijeme = zad.datumIVrijemeSlanja;
      var mjesec = datumIVrijeme.getMonth();
      mjesec++;
      var infoOZadatku = {
        datumSlanja:
          datumIVrijeme.getDate() +
          "/" +
          mjesec +
          "/" +
          datumIVrijeme.getFullYear(),
        vrijemeSlanja: datumIVrijeme.toLocaleTimeString(),
        nazivFajla: zad.nazivDatoteke,
        velicinaFajla: zad.velicinaDatoteke + " MB",
        komentar: zad.komentar
      };
      res.status(200).send(infoOZadatku);
    });
  else res.status(500).send();
});

app.post("/slanjeZadatka", upload.any(), function(req, res) {
// prvi put slanje zadatka
  var bodyReq = req.body;
  var red = 
  {
    idStudent : bodyReq.idStudent,
    idZadatak : bodyReq.idZadatak,
    brojOstvarenihBodova : 0,
    datumIVrijemeSlanja : bodyReq.datumIVrijemeSlanja,
    velicinaDatoteke : bodyReq.velicinaFajla,
    komentar : "",
    tipDatoteke : bodyReq.tipFajla,
    datoteka : req.files[0].buffer,
    stanjeZadatka : 1,
    nazivDatoteke : bodyReq.nazivFajla,
    mimeTipFajla : req.files[0].mimetype
  }

  db.StudentZadatak.findOne({ where: {
    idStudent : bodyReq.idStudent,
    idZadatak : bodyReq.idZadatak
  }})
  .then(function(pronadjenRed){
    if(pronadjenRed) {  // red postoji
      res.status(201).send()
    }
    else {
      db.StudentZadatak.create(red)
      .then(function(upisaniRed){
        res.status(200).send()  
      }).catch(err => res.send(err));  
    }    
  })

});

app.put("/slanjeZadatka", upload.any(), function(req, res){
// update jer se zadatak ponovno salje

  var bodyReq = req.body;
  
  db.StudentZadatak.findOne({ where: {
    idStudent : bodyReq.idStudent,
    idZadatak : bodyReq.idZadatak
  }})
  .then(function(pronadjenRed){
    pronadjenRed.update({
      datumIVrijemeSlanja : bodyReq.datumIVrijemeSlanja,
      datoteka : req.files[0].buffer,
      velicinaDatoteke : bodyReq.velicinaFajla,
      tipDatoteke : bodyReq.tipFajla,
      nazivDatoteke : bodyReq.nazivFajla,
      mimeTipFajla : req.files[0].mimetype
    })
  }).catch(err => res.send(err))

  res.status(200).send();
});

app.get('/downloadPostavka/:nazivZadace', (req, res) => {

  db.Zadaca.findOne({
    where: {
      naziv : req.params.nazivZadace
    }
  }).then(data => {
      res.status(200).json(data);
    })
    .catch(e => res.status(400).send(e))
})

app.get('/downloadZadatak/:idStudent/:idZadatak', (req, res) => {

  db.StudentZadatak.findOne({
    where: {
      idStudent : req.params.idStudent,
      idZadatak : req.params.idZadatak
    }
  }).then(data => {
      res.status(200).json(data);
    })
    .catch(e => res.status(400).send(e))
})

app.get("/dajZadaceZaStudenta/:idStudenta/:idPredmeta", function(req, res) {
  var student = req.params.idStudenta;
  var predmet = req.params.idPredmeta;
  db.Zadaca.findAll({ where: { idPredmet: predmet } }).then(function(zadaca) {
    var imenaZadaca = [],
      brojZadataka = 0,
      listaZadataka = [],
      rokoviZaPredaju = [],
      postavke = [],
      maxBodoviPoZadacima = [];
    for (var i = 0; i < zadaca.length; i++) {
      imenaZadaca.push(zadaca[i].naziv);
      rokoviZaPredaju.push(
        dajDatum(zadaca[i].rokZaPredaju) +
          " " +
          dajVrijeme(zadaca[i].rokZaPredaju)
      );
      postavke.push(zadaca[i].imeFajlaPostavke);
      if (zadaca[i].brojZadataka > brojZadataka)
        brojZadataka = zadaca[i].brojZadataka;
    }
    for (var i = 1; i < brojZadataka + 1; i++) {
      listaZadataka.push("Zadatak " + i);
    }
    db.Zadatak.findAll().then(function(zadaci) {
      var maxZadaciZadace = [],
        bodovi = [],
        stanja = [],
        nizIdZadaci = [];
      for (var i = 0; i < zadaca.length; i++) {
        var pom = [],
          pomocni2 = [],
          pomocni3 = [],
          pomocni4 = [];
        for (var j = 0; j < zadaca[i].brojZadataka; j++) {
          pom.push("");
          pomocni2.push(0);
          pomocni3.push("");
          pomocni4.push("");
        }
        if (zadaca[i].brojZadataka < brojZadataka) {
          for (var k = 0; k < brojZadataka - zadaca[i].brojZadataka; k++) {
            pomocni2.push("");
            pom.push("");
            pomocni3.push("");
            pomocni4.push("");
          }
        }
        nizIdZadaci.push(pom);
        maxZadaciZadace.push(pomocni3);
        bodovi.push(pomocni4);
        stanja.push(pomocni2);
      }
      for (var j = 0; j < zadaca.length; j++) {
        for (var i = 0; i < zadaci.length; i++) {
          if (zadaci[i].idZadaca == zadaca[j].idZadaca) {
            maxZadaciZadace[j][zadaci[i].redniBrojZadatkaUZadaci] =
              zadaci[i].maxBrojBodova;
            nizIdZadaci[j][zadaci[i].redniBrojZadatkaUZadaci] =
              zadaci[i].idZadatak;
          }
        }
      }
      db.StudentZadatak.findAll({ where: { idStudent: student } }).then(
        function(studentic) {
          if (studentic) {
            for (var i = 0; i < zadaca.length; i++) {
              for (var j = 0; j < zadaci.length; j++) {
                for (var k = 0; k < studentic.length; k++) {
                  if (
                    zadaca[i].idZadaca == zadaci[j].idZadaca &&
                    zadaci[j].idZadatak == studentic[k].idZadatak
                  ) {
                    bodovi[i][zadaci[j].redniBrojZadatkaUZadaci] =
                      studentic[k].brojOstvarenihBodova;
                    stanja[i][zadaci[j].redniBrojZadatkaUZadaci] =
                      studentic[k].stanjeZadatka;
                  }
                }
              }
            }
          }
          var data = {
            listaZadaca: imenaZadaca,
            listaZadataka: listaZadataka,
            maxBodoviPoZadacimaPoZadacama: maxZadaciZadace,
            bodoviPoZadacimaZadaca: bodovi,
            rokZaPredaju: rokoviZaPredaju,
            stanjeZadacaPoZadacima: stanja,
            postavka: postavke,
            idPoZadacimaZadaca: nizIdZadaci
          };
          res.status(200).send(data);
        }
      );
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

app.listen(PORT,function(){ console.log('server successfully started on port '+PORT); });