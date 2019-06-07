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

app.get("/getZadace/:predmetId", async function(req, res) {
  try {
    const predmet = await db.Predmet.findOne({
      where: {
        id: req.params.predmetId
      }
    });

    if (!predmet) {
      return res.status(404).send({ poruka: "Predmet ne postoji" });
    }

    const zadace = await db.Zadaca.findAll({});

    return res.send(zadace);
  } catch (e) {
    return res.status(500).send(e);
  }
});

app.get("/getStudenteKojimaNijePregledanaZadaca/:idZadaca", async function(
  req,
  res
) {
  const idZadaca = req.params.idZadaca;

  try {
    const zadaca = await db.Zadaca.findOne({
      where: {
        idZadaca
      }
    });
    if (!zadaca) {
      return res.status(404).send({ poruka: "Zadaca nije nadjena" });
    }
    const korisnici = await db.Korisnik.findAll({});

    return res.send(korisnici);
  } catch (e) {
    console.log(e);
    return res.status(500).send(e);
  }
});

app.get("/getStudenteKojiSuPoslaliZadacu/:idZadaca", async function(req, res) {
  const idZadaca = req.params.idZadaca;

  try {
    const zadaca = await db.Zadaca.findOne({
      where: {
        idZadaca
      }
    });
    if (!zadaca) {
      return res.status(404).send({ poruka: "Zadaca nije nadjena" });
    }
    const korisnici = await db.Korisnik.findAll({});

    return res.send(korisnici);
  } catch (e) {
    console.log(e);
    return res.status(500).send(e);
  }
});

app.get("/getDatoteku", function(req, res) {
  //console.log('datoteka preuzmi');
  res.status(200).send();
});

app.get("/getPregledDatoteke", function(req, res) {
  res.status(200).send();
});

app.get("/getZadacuStudenta/:idZadace/:idStudenta", function(req, res) {
  var zadacaState = {
    zadaciZadace: [
      "Zadatak 1",
      "Zadatak 2",
      "Zadatak 3",
      "Zadatak 4",
      "Zadatak 5"
    ],
    postavkaZadace: "Zadaca 1",
    moguciBodovi: [1, 2, 3, 4, 5],
    ostvareniBodovi: [1, 1, 1, 1, 1],
    rokZaPredaju: "2020-12-01 23:59",
    stanjeZadatakaZadace: [0, 1, 2, 3, 4],
    pregledanZadatak: [true, true, false, false, false]
  };

  res.send(zadacaState);
});

app.get("/getStudenteKojiNisuPoslaliZadacu/:idZadaca", async function(
  req,
  res
) {
  const idZadaca = req.params.idZadaca;

  try {
    const zadaca = await db.Zadaca.findOne({
      where: {
        idZadaca
      }
    });
    if (!zadaca) {
      return res.status(404).send({ poruka: "Zadaca nije nadjena" });
    }
    const korisnici = await db.Korisnik.findAll({});

    return res.send(korisnici);
  } catch (e) {
    console.log(e);
    return res.status(500).send(e);
  }
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
app.post("/dozvoljeniTipoviZadatka", upload.any(), function(req, res) {
  var idZadatakk = req.body.medi;
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

app.get("/popuniZadatakVecPoslan", function(req, res) {
  var infoOZadatku = {
    datumSlanja: "01.01.2019",
    vrijemeSlanja: "22:05",
    nazivFajla: "Testni",
    velicinaFajla: "2MB",
    komentar: ""
  };
  res.status(200).send(infoOZadatku);
});

app.post("/slanjeZadatka", function(req, res) {
  var nazivUploada = req.body;
  //console.log(nazivUploada);
  res.status(200).send(nazivUploada);
});

app.get("/dajZadaceZaStudenta/:indeks", function(req, res) {
  var indeksStudenta = req.params.indeks;
  console.log(indeksStudenta);

  //dohvati iz baze sve info o zadacama studenta sa indeksom indeksStudenta
  var data = {
    listaZadaca: ["1", "2", "3"],
    listaZadataka: ["Mjesec", "Cao", "pozz"], //ovjde treba staviti listu zadataka od zadace koja ima najvise zadataka -- zbog kreiranja tabele
    maxBodoviPoZadacimaPoZadacama: [[2, 2, 2], [1, 1, 1], [3, 3, 3]],
    bodoviPoZadacimaZadaca: [[2, 2, 1.8], [0, 0, 0], [0, 0, 0]],

    rokZaPredaju: ["2019-12-01 23:59", "2019-02-01 23:59", "1000-12-01 23:59"],
    stanjeZadacaPoZadacima: [[2, 0, 4], [3, 2, 3], [0, 1, 0]],
    postavka: []
  };

  res.status(200).send(data);
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
