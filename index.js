exports.doMachineLearning = functions.https.onRequest((request, response) => {
  var myclicks = {}; 
  var users = {};
  var avg = {};
  var similarity = {};
  var dupsim = {};
  var top = {};
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
      return;
    })  
    return db.collection("Average").doc("Clicks").get();
  }).then((snapshot) =>{
    
    //Fetching average data

    avg = snapshot.data();  
    return  db.collection("Clicks").get();
  }).then((snapshot) => {
      //Calculating Similarity
    snapshot.forEach((doc) => {
      var usn = doc.get("user");
      console.log("REQ="+req+"\tUSN="+usn);
      if(usn !== req)
      {
        var vals = doc.data();
        delete vals['user'];
        users[usn] = vals;

        var sum = 0;
        Object.keys(vals).forEach((prod) => {
          
          if(vals[prod] !== usn )
          {
            var myval = myclicks[prod];
            var otherval = vals[prod];
            var avgval = avg[prod];
            if(prod in myclicks)
            {
              console.log("myval="+myval+"\totherval="+otherval+"\tsum="+sum);
              sum = sum + (myval - otherval)*(myval - otherval);
            }
            else
            {
              console.log("otherval= "+otherval+"\tavgval "+avgval+"\tsum="+sum);
              sum = sum + (avgval - otherval)*(avgval - otherval);
            }
          }
        });
        sum = 1/(1+Math.sqrt(sum));
        console.log("usn="+usn+"\tsum="+sum);
        similarity[usn] = sum;
        console.log("Similarity=",similarity);
      }
    })
    return db.collection("Items").get();
  }).then((snapshot)=> {
    // similarity['a']= 0.3; similarity['b']= 0.12; similarity['c']=0.36; similarity['d']=0.6; similarity['e']=0.99; similarity['f']=0.32;
    var itemlist =[];
    snapshot.forEach((snaps)=>{
      itemlist.push(snaps.id);
    })
    // response.send(itemlist);

    //Finding top 5 similar users
    
    dupsim = similarity;
    var keys = Object.keys(dupsim);
    var count=0;
    while(keys.length && count<5)
    {
      var max = keys.reduce((a, b) => dupsim[a] > dupsim[b] ? a : b);
      top[max] = similarity[max];
      delete dupsim[max];
      keys = Object.keys(dupsim);
      count++;
    }
    console.log("Top=",top);

    //Finding Item Recommendation
    var weight;
    var counts= {};
    var prod = {}; 
    console.log("Users=",users);
    Object.keys(top).forEach((user) =>{
      weight = top[user];
      console.log("weight=",weight)
      Object.keys(users[user]).forEach((item) => {
        var vall = users[user][item];
        console.log("vall=",vall);
        if(item in counts)
          counts[item] +=weight;
        else
          counts[item] = weight;
        if(item in prod)
          prod[item] += weight * vall;
        else
          prod[item] = weight *vall;
      });
    });
    console.log("Count=",counts,"\tprod=",prod);
    for(keys in prod)
    {
        prod[keys] = prod[keys]/ counts[keys];
    }
    db.collection("Users").doc(req).collection("ML").doc("Items").set(prod);
    var prods= {}; c ={};
    delete myclicks['user'];
    users[req] = myclicks;

    Object.keys(users).forEach((user) => {
      Object.keys(users[user]).forEach((item) =>{
        var vall = users[user][item];
        if(item in c)
          c[item] += 1;
        else
          c[item] = 1;
        if(item in prods)
          prods[item] += vall;
        else
          prods[item] = vall;
      });
    });
    
    for(keys in prods)
    {
        prods[keys] = prods[keys]/ c[keys];
    }
    for(i in itemlist)
    {
      if(!(Object.keys(prods).includes(itemlist[i])))
        prods[itemlist[i]] = 0;
    }
    db.collection("Average").doc("Clicks").set(prods);
    return;
  })
  .catch((err) => {
    console.log('Error getting documents', err);
    return;
  });
  // response.send("Hehe...")
});
