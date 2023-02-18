
"use strict";

(function () {
    //değişkenler
    let attrArray = ["y_2017", "y_2018", "y_2019", "y_2020", "y_2021"];
    let expressed = attrArray[0];

    //chart frame 
    let chartWidth = window.innerWidth * 0.470,
        chartHeight = 355,
        leftPadding = 50,
        rightPadding = 0,
        topBottomPadding = 0,
        //chartInnerWidth ve chartInnerHeight: verilerin çizileceği alanın boyutları
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //yScale:grafikteki çubukları çerçeveyle ve y ekseniyle orantılı olarak boyutlandırmak için kullanılacak doğrusal ölçek/ 0-420 aralığını 350-0 pixel aralığıyla eşler
    let yScale = d3.scaleLinear().range([350, 0]).domain([0, 420]);










    window.onload = setMap();

    function setMap() {
        // harita çerçevesi boyutları 
        let width = window.innerWidth * 0.5,
            height = 460;


        // map için svg oluşturduk 
        let map = d3
            .select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);



        //çalışm alanı için oluşturulan projeksiyon (notlara bak )
        let projection = d3.geoAlbers()
            .center([0.00, 47.0])

            .rotate([-28.91, 9.09, 0])

            .parallels([29.73, 45.5])

            .scale(10000.00)

            .translate([width / 2, height / 2]);

        let path = d3.geoPath().projection(projection);



        //promise.all ile dosyalar asenkron olarak yüklenir/callback tüm veriler yüklendikten sonra çağırılır
        let promises = [d3.csv("data/dist_4326.csv"),
        d3.json("data/prov4326.topojson"),
        d3.json("data/dist_4326.topojson")
        ];
        Promise.all(promises).then(callback);

        function callback(data) {
            let csvData = data[0],
                prov = data[1],
                dist = data[2];

            setGraticule(map, path);



            let provTr = topojson.feature(prov, prov.objects.prov4326),
                distDn = topojson.feature(dist, dist.objects.dist_4326).features;

            // map nesnesine "path" eklendi  bu "path" nesnesine, "provTr" değişkenindeki veriler ve cities sınıfı atandı
            let cities = map
                .append("path")
                .datum(provTr)
                .attr("class", "cities")
                .attr("d", path);// d:svg ögesinin gösterim şeklini belirtir

            distDn = joinData(distDn, csvData);

            let colorScale = makeColorScale(csvData);

            //setEnumerationUnits:verileri haritada göstermek için kullanılır(biçimleri)
            setEnumerationUnits(distDn, map, path, colorScale);

            // setChart:eklenen verilerin grafik gösterimi
            setChart(csvData, colorScale);

            createDropdown(csvData);

        }
    }









    //GRATİCULE
    function setGraticule(map, path) {
        let graticule = d3.geoGraticule().step([0.5, 0.5]); //enlem ve boylam aralıkları(derece)


        let gratBackground = map
            .append("path")
            .datum(graticule.outline())
            .attr("class", "gratBackground")
            .attr("d", path);


        let gratLines = map
            .selectAll(".gratLines") // gratLines sınıfındaki tüm  ögeleri seçtik
            .data(graticule.lines()) //
            .enter()
            .append("path")
            .attr("class", "gratLines")
            .attr("d", path);
    }









    // JOİN 
    // ilçe geometrilerini csv dosyasındaki veriler ile birleştireceğiz
    function joinData(distDn, csvData) {

        for (let i = 0; i < csvData.length; i++) {
            let csvRegion = csvData[i];
            let csvKey = csvRegion.dis_name; //csv primary key


            for (let a = 0; a < distDn.length; a++) {
                let geojsonProps = distDn[a].properties; // geojson properties 
                let geojsonKey = geojsonProps.dis_name; // geojson primary key


                if (geojsonKey == csvKey) {

                    attrArray.forEach(function (attr) {
                        let val = parseFloat(csvRegion[attr]);
                        geojsonProps[attr] = val;
                    });
                }
            }
        }
        return distDn;
    }








    // COLOR SCALE
    function makeColorScale(data) {
        let colorClasses = ["#D4B9DA", "#C994C7", "#DF65B0", "#DD1C77", "#980043"];


        let colorScale = d3.scaleQuantile().range(colorClasses);

        let domainArray = [];
        for (let i = 0; i < data.length; i++) {
            let val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        }

        colorScale.domain(domainArray);

        return colorScale;
    }







    // İLLER
    function setEnumerationUnits(distDn, map, path, colorScale) {

        let district = map
            .selectAll(".district")
            .data(distDn)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "district " + d.properties.dis_name;
            })
            .attr("d", path)
            .style("fill", function (d) {
                let value = d.properties[expressed];
                if (value) {
                    return colorScale(d.properties[expressed]);
                } else {
                    return "#ccc";
                }
            })
            .on("mouseover", function (event, d) {
                highlight(d.properties);
            })
            .on("mouseout", function (event, d) {
                dehighlight(d.properties);
            })
            .on("mousemove", moveLabel);

        let desc = district.append("desc").text('{"stroke": "#000", "stroke-width": "0.5px"}');
    }








    //BAR CHART
    function setChart(csvData, colorScale) {
        //yeni bir svg oluşturduk
        let chart = d3
            .select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        let chartBackground = chart
            .append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        //her ilçe için grafik  ayarları
        let bars = chart
            .selectAll(".bar")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function (a, b) {
                return b[expressed] - a[expressed];
            })
            .attr("class", function (d) {
                return "bar " + d.dis_name;
            })
            .attr("width", chartInnerWidth / csvData.length - 1)
            .on("mouseover", function (event, d) {
                highlight(d);
            })
            .on("mouseout", function (event, d) {
                dehighlight(d);
            })
            .on("mousemove", moveLabel);

        //grafik başlığı için text
        let chartTitle = chart
            .append("text")
            .attr("x", 40)
            .attr("y", 40)
            .attr("class", "chartTitle");

        updateChart(bars, csvData.length, colorScale);

        // dikey ekseni
        let yAxis = d3.axisLeft().scale(yScale);

        //yatay eksen 
        let axis = chart.append("g").attr("class", "axis").attr("transform", translate).call(yAxis);

        //chart frame
        let chartFrame = chart
            .append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        let desc = bars.append("desc").text('{"stroke": "none", "stroke-width": "0px"}');
    }









    //DROPDOWN
    function createDropdown(csvData) {
        let dropdown = d3
            .select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function () {
                changeAttribute(this.value, csvData);
            });

        //ilk görünüm
        let titleOption = dropdown
            .append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");

        //attArray dizisindeki öznitelik adlarından option oluşturur
        let attrOptions = dropdown
            .selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function (d) {
                return d;
            })
            .text(function (d) {
                return d;
            });
    }



    function changeAttribute(attribute, csvData) {
        expressed = attribute;
        let colorScale = makeColorScale(csvData);

       
        let district = d3
            .selectAll(".district")
            .transition()
            .duration(1000)
            .style("fill", function (d) {
                let value = d.properties[expressed];
                if (value) {
                    return colorScale(value);
                } else {
                    return "#ccc";//değeri 0 olanlar
                }
            });

        //çubukların veriye bağlı değişiklikleri
        let bars = d3
            .selectAll(".bar")
            //azalan sırada yeniden sıralama
            .sort(function (a, b) {
                return b[expressed] - a[expressed];
            })
            .transition() //geçiş efekti
            .delay(function (d, i) {
                return i * 20;//her öğeye i * 20 milisaniyelik bir gecikme uygulanır
            })
            .duration(500);//her bir öğe için değişim  süresi

        updateChart(bars, csvData.length, colorScale);

        
    }









    // Chart Update
    function updateChart(bars, n, colorScale) {
        //konumu
        bars.attr("x", function (d, i) {
            return i * (chartInnerWidth / n) + leftPadding;
        })
            //boyutu
            .attr("height", function (d, i) {
                return 463 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function (d, i) {
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })

            .style("fill", function (d) {
                let value = d[expressed];
                if (value) {
                    return colorScale(value);
                } else {
                    return "#ccc";
                }
            });

        let chartTitle = d3
            .select(".chartTitle")
            .text("Tree Cover Loss (ha)");
    }









    //vurgu
    function highlight(props) {
        let selected = d3
            .selectAll("." + props.dis_name)
            .style("stroke", "blue")
            .style("stroke-width", "2");
        setLabel(props);
    }


    function dehighlight(props) {
        let selected = d3
            .selectAll("." + props.dis_name)
            .style("stroke", function () {
                return getStyle(this, "stroke");//varsayılan değerlere ayarlar
            })
            .style("stroke-width", function () {
                return getStyle(this, "stroke-width");
            });

        function getStyle(element, styleName) {
            let styleText = d3.select(element).select("desc").text();//varsayılan değerleri alır

            let styleObject = JSON.parse(styleText);

            return styleObject[styleName];
        }
        //remove info label
        d3.select(".infolabel").remove();
    }







    //LABEL

    function setLabel(props) {

        let labelAttribute = "<h1>" + props[expressed] + "</h1><b>" + expressed + "</b>";

        let infolabel = d3
            .select("body")
            .append("div")
            .attr("class", "infolabel")
            .html(labelAttribute);

        let regionName = infolabel.append("div").attr("class", "labelname").html(props.name);
    }








    function moveLabel() {
        //getBoundingClientRect(): etiketin boyutunu ve konumunu görüntü alanına göre döndürür
        let labelWidth = d3.select(".infolabel").node().getBoundingClientRect().width;

        //mouse koordinatlarına göre etiket konumu
        let x1 = event.clientX + 10,
            y1 = event.clientY - 75,
            x2 = event.clientX - labelWidth - 10,
            y2 = event.clientY + 25;


        let x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;

        let y = event.clientY < 75 ? y2 : y1;

        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    }
})();





