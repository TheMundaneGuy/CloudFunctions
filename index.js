exports.helloWorld = functions.https.onRequest((request, response) => {
  var myclicks = {}; 
  var avg = {};
  var delay=0;
  var req = request.body.id;

  //Getting User Click Data
  console.log(req);
  db.collection("Clicks").where("user","==",req).get().then((snapshot) => {  
    if (snapshot.empty) {
      console.log('No matching documents.');
      return;
    }
    snapshot.forEach((doc) => {
      myclicks = doc.data();
      console.log('Myclicks =', myclicks);
      return;
    })  
    return;
  })
  .catch((err) => {
    console.log('Error getting documents', err);
    return;
  });

  //Getting Average Click Data
  db.collection("Average").doc("Clicks").get().then((snapshot) => {  
    avg = snapshot.data();  
    console.log('avg =', avg);
    return;
  })
  .catch((err) => {
    console.log('Error getting documents', err);
    return;
  });

  //Calculating Similarity
  var similarity = {};
  db.collection("Clicks").get().then((snapshot) => {  
    console.log(myclicks);
    console.log(avg);
    snapshot.forEach((doc) => {
      var usn = doc.user;
      if(usn !== req)
      {
        var vals = doc.data();
        var sum = 0;
        Object.keys(vals).forEach((prod) => {
          var myval = myclicks[prod];
          var otherval = vals[prod];
          var avgval = avg[prod];
          // console.log(myval+" "+otherval+" "+avgval);
          if(prod in myclicks)
          {
            sum = sum + (myval - otherval)*(myval - otherval);
          }
          else
          {
            sum = sum + (avgval - otherval)*(avgval - otherval);
          }
        });
        sum = 1/(1+Math.sqrt(sum));
        similarity[usn] = sum;
        console.log("similarity= "+similarity);
      }
    })
    return;
  })
  .catch((err) => {
    console.log('Error getting documents', err);
    return;
  });
  response.send(myclicks);
});
