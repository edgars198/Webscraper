'use strict';

var request = require("request"),
	cheerio = require("cheerio"),
	url = "http://www.tesco.ie/groceries/",
	aldiUrl = "https://www.aldi.ie/en/product-range/";
var fs = require("fs");



//start(main fn)
getNewData();


var lastlink = false;
var lastCat = false;
var lastSuperCat = false;
var finished = false;

var prods = [];

function getDetails(cb) {
	setTimeout(function() {
		console.log('hits the tesco scraping');
		request(url, function(error, response, body) {
			if (!error) {
				var $ = cheerio.load(body);
				var link = "1";
				var i = 1;
				//gets links to types of products
				while (link !== null) {
					link = $("#nav-" + i + " > a").attr("href");
					//console.log(link);
					if (link == null && prods.length > 13000) {
						//it's finished
						//product_items = prods;
						savetodb(prods, 0);
						break;
					} else {
						extractCategories(link);
						i++;
					}
				}
			} else {
				console.log("We’ve encountered an error: " + error);
			}
		});
	}, 100);
	cb();
}

function sleep(delay) {
	var currTime = new Date().getTime();

	while (currTime + delay > new Date().getTime()) {}
}

function extractCategories(url) {
	setTimeout(function() {
		request(url, function(error, response, body) {
			if (!error) {
				var $ = cheerio.load(body);
				var link1 = "1";
				var link2 = "1";
				var temp;
				var categ1, categ2;
				//gets the links of categories
				var i = 1;


				//column 1
				while (link1 !== null) {
					temp = $("ul.first > li:nth-child(" + i + ") > a:nth-child(1)").attr("href");
					if (temp == null) break;
					link1 = temp;
					console.log(link1);
					categ1 = $("ul.first > li:nth-child(" + i + ") > a:nth-child(1)").text();
					if (link1 === undefined) {
						//lastSuperCat = true;
						break;
					}
					//console.log(link1);
					lastSuperCat = false;
					extractInfo(link1, categ1);
					i++;

				}

				var y = 1;
				//column 2
				while (link2 !== null) {
					temp = $("#superDeptItems > div:nth-child(3) > ul:nth-child(1) > li:nth-child(" + y + ") > a:nth-child(1)").attr("href");
					if (temp == null) break;
					link2 = temp;
					console.log(link2);
					categ2 = $("#superDeptItems > div:nth-child(3) > ul:nth-child(1) > li:nth-child(" + y + ") > a:nth-child(1)").text();
					if (link2 === undefined) {
						break;
					}

					lastSuperCat = false;
					extractInfo(link2, categ2);
					y++;

				}

				if (link1 === undefined && link2 === undefined) {
					lastSuperCat = true;
				} else {
					lastSuperCat = false;
				}
			} else {
				console.log("We’ve encountered an error in CATEGORIES: " + error);
				sleep(100);
				extractCategories(url);
			}
		});
	}, 100);
}

function extractInfo(url, categ) {

	var lnx = "";
	var linksToItems = "";
	var nextLink = "";
	setTimeout(function() {
		request(url, function(error, response, body) {
			if (!error) {
				var $ = cheerio.load(body);
				var i = 1;

				var lin = {
					link: "",
					categ: ""
				};

				var linToGo = {
					link: "",
					categ: ""
				};

				$("li[id*='p-']").each(function() {


					lin.link = extractID($(this).attr("id"));;
					lin.categ = categ;
					//links.push(lin);
					//buffer.push(lin);

					extractProducts(lin.link, lin.categ, function() {

						linToGo = buffer.pop();
						extractProducts(linToGo.link, linToGo.categ);
					});
				});


				//gets the link for next page
				nextLink = $("p.next > a").attr("href");

				/*    for (i = 0; i < lnx.length; i++) {
				        console.log(lnx[i]);
				    } */
				if (nextLink != null) {
					extractInfo(nextLink);
					lastlink = false;
				} else {
					//console.log("finito links");
					if (nextLink == null) lastlink = true;
				}
			} else {
				console.log("We’ve encountered an error in LINKS: " + error);
				sleep(100);
				extractInfo(url, categ);
			}
			//console.log('last link: '+ lastlink);

		});
	}, 100);
}

function extractTypes() {

	request(url, function(error, response, body) {
		if (!error) {
			var $ = cheerio.load(body);
			var link = "1";
			var i = 1;
			//gets links to types of products
			while (link !== null) {
				link = $("#nav-" + i + " > a").attr("href");
				console.log(link + ' ' + lastCat);
				if (link === undefined) {
					debugger;
					lastCat = true;
					console.log('finished types');
					break;
				} else {
					lastCat = false;
					extractCategories(link);
					i++;
				}
			}
		} else {
			console.log("We’ve encountered an error in TYPES: " + error);
			sleep(100);
			extractTypes();
		}
	});
}

function extractName(str) {
	var inName = "";
	var i = 0;

	while (str.charAt(i) != '-') {
		inName = inName + str.charAt(i);
		i++;
	}

	return inName;
}

function extractStandart(str) {
	var sandard = '';
	var i = 0;

	while (str.charAt(i) != '/') {
		i++;
	}

	i++;
	while (i < str.length - 1) {
		sandard = sandard + str.charAt(i);
		i++;
	}

	return sandard;
}

function extractPrice(str) {
	var price = '';
	var i = 0;

	while (str.charAt(i) != ';') {
		i++;
	}
	i++;
	while (str.charAt(i) != '/' && str.charAt(i) != '<') {
		price = price + str.charAt(i);
		i++;
	}

	price = parseFloat(price);
	return price;
}

function extractID(str) {
	var ID = '';
	var i = 0;

	if (str.indexOf('-') >= 0) {
		while (str.charAt(i) != '-') {
			i++;
		}
		i++;
		while (str.charAt(i) != '-') {
			ID = ID + str.charAt(i);
			i++;
		}
		ID = parseFloat(ID);
		ID = "http://www.tesco.ie/groceries/Product/Details/?id=" + ID;
		return ID;
	}
}

function doTheProductStuff(url, cat, response, body) {
	var $ = cheerio.load(body);

	var name = "";
	var pricePerSandart;
	var pricePerProduct;
	var typeOfStandard;
	var pic = "";

	var item = {
		name: "",
		category: "",
		link_pic: "",
		description: "",
		minAge: "",
		allergies: "",
		ingredients: "",
		store: "Tesco",
		link_store: "",
		price: "",
		pps: ""
	};
	item.category = cat;

	if (item.category == "Beer & Cider" || item.category == "Wine" || item.category == "Spirits") {
		item.minAge = 18;
	} else {
		item.minAge = 0;
	}

	item.link_store = url;
	//gets price of sandart
	pricePerSandart = $(".linePriceAbbr").html();
	//gets price of product
	pricePerProduct = $(".linePrice").html();
	//gets name of product
	name = $("title").text();
	console.log(count++ + ' ' + name);
	//count++;
	item.link_pic = $(".imageColumn > p:nth-child(1) > img:nth-child(1)").attr('src');

	if (pricePerSandart == null || pricePerProduct == null || name == null) {
		//console.log('ERROR in PRODUCTS: field undefined');
		return;
	}

	//extracts type of standard
	typeOfStandard = extractStandart(pricePerSandart);

	//extracts the price & turns into a float
	pricePerSandart = extractPrice(pricePerSandart);
	pricePerProduct = extractPrice(pricePerProduct);

	//extracts name
	name = extractName(name);

	item.name = name;
	item.price = pricePerProduct;
	item.pps = pricePerSandart;

	console.log(count++ + ': ' + item.name);
	prods.push(item);
	//writeData();

}

function extractProducts(url, cat) {
	setTimeout(function() {
		request(url, function(error, response, body) {
			if (!error) {
				doTheProductStuff(url, cat, response, body);
			} else {
				console.log("We’ve encountered an error in PRODUCTS: " + error);
				sleep(100);
				extractProducts(url, cat);
			}
		});
	}, 100);
}


//gets links of the categories
function aldiExtractTypes() {
	setTimeout(function() {
		request(aldiUrl, function(error, response, body) {
			if (!error) {
				var link = "1";
				var i = 8; //starting point in DOM of actual products
				var $ = cheerio.load(body);

				while (link !== null) {
					link = $("li.tab-nav--item:nth-child(" + i + ") > a:nth-child(1)").attr('href');
					console.log('Type Link: ' + link);
					if (link == null) {
						break;
					} else {
						aldiExtractCategories(link);
						i++;
					}
				}
			} else {
				console.log("We’ve encountered an error: " + error);
				sleep(100);
				aldiExtractTypes();
			}
		});
	}, 100);
}

function aldiExtractCategories(catAldiUrl) {
	setTimeout(function() {
		request(catAldiUrl, function(error, response, body) {
			if (!error) {
				var $ = cheerio.load(body);
				var link = "1";
				var numInvalidLinks = 0;

				var i = 1;

				while (link !== null) {
					link = $("li.sub-nav--item:nth-child(" + i + ") > a:nth-child(1)").attr('href');
					console.log('Cat Link: ' + link);
					if (link === undefined) {
						numInvalidLinks++;
						if (numInvalidLinks > 3) continue;
						else break;
					} else {
						aldiExtractProducts(link);
						i++;
					}
				}

			} else {
				console.log("We’ve encountered an error: " + error);
				sleep(100);
				aldiExtractCategories(catAldiUrl);
			}
		});
	}, 100);
}

function savetodb(arr, i, cb) {
	console.log('supposed to save to DB');
}

function getNewData() {
	console.log('Getting new Data');
	getDetails(function() {
		console.log('hits aldi callback');
		aldiExtractTypes();
	});
}

function aldiExtractProducts(prodAldiUrl) {
	setTimeout(function() {
		request(prodAldiUrl, function(error, response, body) {
			if (!error) {

				var $ = cheerio.load(body);
				var link;
				var standart;
				var priceEur;
				var priceCent;
				var base;
				var name = "1";

				var item = {
					name: "",
					category: "",
					link_pic: "",
					description: "",
					minAge: "",
					allergies: "",
					ingredients: "",
					store: "Aldi",
					link_store: "",
					price: "",
					pps: ""
				};

				var i = 1; //DOM starting point of products


				while (item.link_store != null) {

					item.link_store = $("div.box--wrapper:nth-child(" + i + ") > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > h2:nth-child(1) > a:nth-child(1)").attr('href');
					console.log('Item Link: ' + item.link_store);
					if (item.link_store == null) {
						continue;
					}

					item.name = $("div.box--wrapper:nth-child(" + i + ") > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > h2:nth-child(1) > a:nth-child(1)").text();
					//formatting
					item.name = item.name.replace(/[\t\n]+/g, ' ').slice(1);

					var firstSpan = $(" div.box--wrapper:nth-child(" + i + ") > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > span:nth-child(2)").text();
					var secondSpan = $(" div.box--wrapper:nth-child(" + i + ") > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > span:nth-child(3)").text();

					var superSixSpan = $(" div.box--wrapper:nth-child(" + i + ") > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > span:nth-child(3)").text();

					var price;
					//var toshow = (item.link_store.indexOf('super-6') >= 0) ? superSixSpan : firstSpan;
					if (firstSpan.indexOf('.') < 0 && firstSpan.indexOf('€') < 0 && item.link_store.indexOf('super-6') < 0) {
						//console.log(toshow + ': hit the first if');
						// cent only price
						firstSpan = firstSpan.replace(/[^\d]/g, '');
						price = parseFloat('0.' + firstSpan);
					} else if (firstSpan.indexOf('.') >= 0 && firstSpan.indexOf('€') >= 0 && !secondSpan) {
						//console.log(toshow + ': hit the second if');
						firstSpan[firstSpan.indexOf('€')] = '';
						price = parseFloat(firstSpan);
					} else if (item.link_store.indexOf('super-6') >= 0) {
						//console.log('Third IF');
						//console.log('1st:' + firstSpan + '||2nd:' + secondSpan + '||2nd:' + superSixSpan);
						//console.log(toshow + ': hit the third if');
						// Super 6 items
						if (secondSpan.length > 0) {
							if (secondSpan.indexOf('€') >= 0) {
								price = parseFloat(secondSpan.replace(/[^\d]/g, ''));
							} else {
								price = parseFloat('0.' + secondSpan.replace(/[^\d]/g, ''));
							}
						} else {
							if (firstSpan.indexOf('€') >= 0) {
								price = parseFloat(firstSpan.replace(/[^\d]/g, ''));
							} else {
								price = parseFloat('0.' + firstSpan.replace(/[^\d]/g, ''));
							}
						}
					} else {
						//console.log(toshow + ': hit the fourth if');
						// Normal products
						firstSpan = firstSpan.replace(/[^\d]/g, '');
						secondSpan = secondSpan.replace(/[^\d]/g, '');
						price = parseFloat(firstSpan + '.' + secondSpan);
					}

					//var blah = (price == 0) ? item.link_store : 'Nothing wrong';
					var blah = item.link_store;
					if (price == 0) console.log(blah);

					item.link_pic = $("div.box--wrapper:nth-child(" + i + ") > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > a:nth-child(1) > img:nth-child(1)").attr('src');


					if ((price.toString().split('.')[1] || []).length > 2) {
						while ((price.toString().split('.')[1] || []).length > 2) {
							price *= 10;
						}
					}



					//gets the price
					item.price = parseFloat(price) || null;
					if (item.link_store != null && !isNaN(item.price)) {
						console.log(count++ + ': ' + item.name);
						prods.push(item);
					}

					i++;

				}

			} else {
				console.log("We’ve encountered an error: " + error);
				sleep(100);
				aldiExtractProducts(prodAldiUrl);
			}
		});
	}, 100);
}