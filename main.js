const width = 1200, height = 800 

const svg = d3.select('.map-node').append('svg')
    .attr('width', width)
    .attr('height', height)

const projection = d3.geoEquirectangular()
    .rotate([0, 0])
    // .center([0, 33.507])
    .scale(200)
    .translate([width / 2, height / 2])

const path = d3.geoPath().projection(projection)

var legendColor = d3.scaleSequential()
    .domain([0, 16])
    .interpolator(d3.interpolateSinebow)

var legendPie = d3.pie()
    .value(function (d) { return d.value; })

var legendData = legendPie(d3.entries(Array(16).fill(1)))

d3.json('world-map.json', (error, data) => {
    if (error) { throw error }

    const angleScale = d3.scaleSequential()
        .domain([0, 6.28])
        .interpolator(d3.interpolateRainbow)

    const centroidz = data.features.map(feature => { return path.centroid(feature) });

    const myName = svg.append('text').attr('class', 'my-name')
        .text('@JackMerlinBruce')
        .attr('x', width /2)
        .attr('y', height - 50)
        .style('text-anchor', 'middle')

    const countries = svg.append('g').attr('class', 'countries')
        .selectAll('path')
        .data(data.features)
        .enter().append('path')
        .attr('d', path)
        .attr('class', 'country')
        .attr('id', d => { return d.id })
        .attr('name', d => { return d.properties.name })
        .style('fill', 'floralwhite')
        .style('stroke', 'floralwhite')
        .style('stroke-width', 0.5)
        .style('opacity', 1)
        .on('mouseover', connectCentroids)
        .on('mouseout', disconnectCentroids)

    const legend = svg.append('g').attr('class', 'legend')
        .selectAll('whatever')
        .data(legendData)
        .enter()
        .append('path')
        .attr('d', d3.arc()
            .innerRadius(50)
            .outerRadius(40)
        )
        .attr('fill', (d, i) => { return legendColor(i) })
        // .attr("stroke", (d, i) => { return legendColor(i) })
        .style("opacity", 0.7)
        .attr("transform", "translate(" + 150 + "," + 450 + ")")

    // const cities = svg.append('g').attr('class', 'cities')
    //     .append('path')
    //     .attr('d', path({
    //         "type": "Point",
    //         "coordinates": [
    //             0.1278,
    //             51.5074
    //         ]
    //     }))
    //     .style('fill', 'red')
    //     .style('stroke', 'green')
    //     .style('stroke-width', 5)

    function generateCentroids() {
        // const centroids = {}
        // Array.from(document.getElementsByClassName('country')).forEach(country => {
        //     let bbox = country.getBBox()
        //     centroids[country.getAttribute('id')] = {
        //         'x': (bbox.x) + (bbox.width / 2),
        //         'y': (bbox.y) + (bbox.height / 2)
        //     }
        // })

        const centroids = []
        Array.from(document.getElementsByClassName('country')).forEach(country => {
            let bbox = country.getBBox()
            centroids.push({
                'id': country.getAttribute('id'),
                'x': (bbox.x) + (bbox.width / 2),
                'y': (bbox.y) + (bbox.height / 2)
            })
        })
        return centroids
    }    
    const centroids = generateCentroids()

    let delay = 30
    let fadeOutMap
    function connectCentroids(thisCountry) {
        let bbox = thisCountry.getBBox()
        let centroidX = (bbox.x) + (bbox.width / 2)
        let centroidY = (bbox.y) + (bbox.height / 2)
        let angles = []

        // Draw line from selected country to centroid of every other
        svg.append('g').attr('class', 'centroids')
            .selectAll('line')
            .data(centroids)
            .enter().append('line')
            .attr('x1', centroidX)
            .attr('x2', centroidX)
            .attr('y1', centroidY)
            .attr('y2', centroidY)
            .attr('stroke', d => {
                let angle = Math.atan2(centroidY - d.y, centroidX-d.x)
                angles.push(angle)
                return angleScale(angle)
            })
            .attr('stroke-width', 5)
            .attr('stroke-linecap', 'round')
            .attr('stroke-opacity', 0.2)
            .transition()
                .duration(2000)
                .delay((d, i) => { return i * delay })
                .attr('x2', d => { return d.x })
                .attr('y2', d => { return d.y })

        // Add country name as a tooltip
        svg.append('text').attr('class', 'country-name')
            .text(thisCountry.getAttribute('name'))
            .attr('x', centroidX)
            .attr('y', 90)
            .attr('fill', angleScale(d3.mean(angles)))
            .style('text-anchor', () => {
                if (centroidX > (width * 0.9)) {
                    return 'end'
                } else if (centroidX < (width * 0.1)) {
                    return 'start'
                } else {
                    return 'middle'
                }
            })
        svg.append('text').attr('class', 'desc')
            .text('connected to every other country')
            .attr('x', centroidX)
            .attr('y', 110)
            .attr('fill', angleScale(d3.mean(angles)))
            .style('text-anchor', () => {
                if (centroidX > (width * 0.9)) {
                    return 'end'
                } else if (centroidX < (width * 0.1)) {
                    return 'start'
                } else {
                    return 'middle'
                }
            })

        // Move legend
        legend
            .transition()
            .duration(300)
            .attr("transform", "translate(" + centroidX + "," + centroidY + ")")
        
        // Hide all other countries
        d3.selectAll('.country')
            .style('opacity', 0.05)
        
        // Highlight current country
        d3.select(thisCountry)
            .style('fill', 'rgb(34, 34, 34)')
            .style('opacity', 1)
            .style('transform', 'translateX(100)')
            .style('cursor', 'none')

        // Fadeout all other countries after n seconds
        let n = 2000
        fadeOutMap = setTimeout(() => {
            d3.selectAll('.country')
                .transition()
                .duration(n)
                .style('opacity', 0)
            legend.transition()
                .duration(n)
                .style('opacity', 0)
        }, (centroids.length * delay) - n)

        // svg.append('g').attr('class', 'centroids')
        //     .selectAll('path')
        //     .data(data.features)
        //     .enter().append('path')
        //     .attr('d', d => {
        //         return path({
        //             type: "LineString",
        //             coordinates: [[0.1278, 50.5074], path.centroid(d)]
        //         })
        //     })
        //     .style('fill', 'none')
        //     .style('stroke', 'orange')
        //     .style('stroke-width', 0.5)
        //     .attr('stroke-opacity', 0.5)

    }
    function disconnectCentroids() {
        d3.select('.centroids')
            .remove()
        d3.select('.country-name')
            .remove()
        d3.select('.desc')
            .remove()
        d3.selectAll('.country')
            .style('fill', 'floralwhite')
            .style('opacity', 1)
        legend
            .style('opacity', 1)
        clearTimeout(fadeOutMap)
    }

    let c = 0
    Array.from(document.getElementsByClassName('country')).forEach(country => {
        setTimeout(() => {
            console.log('connecting', country.id)
            connectCentroids(country)
        }, (centroids.length * delay) * (c))
        setTimeout(() => {
            console.log('diconnecting', country.id)
            disconnectCentroids()
        }, (centroids.length * delay) * (c + 2))
        c += 2
    })

    function connectCentroidsMouse(mouseCoors) {
        let centroidX = mouseCoors[0]
        let centroidY = mouseCoors[1]

        // Draw line from selected country to centroid of every other
        // svg.append('g').attr('class', 'centroids')
        //     .selectAll('line')
        //     .data(centroids)
        //     .enter().append('line')
        //     .attr('x1', centroidX)
        //     .attr('y1', centroidY)
        //     .attr('x2', d => { return d.x })
        //     .attr('y2', d => { return d.y })
        //     .attr('stroke', d => {
        //         let angle = Math.atan2(d.y - centroidY, d.x - centroidX)
        //         return angleScale(angle)
        //     })
        //     .attr('stroke-width', 5)
        //     .attr('stroke-linecap', 'round')
        //     .attr('stroke-opacity', 0.2)
        legend
            .attr("transform", "translate(" + centroidX + "," + centroidY + ")")

    }
    // svg.on('mousemove', function() {
    //     disconnectCentroids()
    //     connectCentroidsMouse(d3.mouse(this))
    // })
















    // const dCircle1 = `
    //     M 100, 100
    //     a 75,75 0 1,0 150,0
    //     a 75,75 0 1,0 -150,0
    // `
    // const dCircle2 = (t) => {
    //     return `
    //         M 100, 100
    //         m ${t * 200}, ${t * 200}
    //         a ${t * 100},${t * 100} 0 1,0 150,0
    //         a ${t * 100},${t * 100} 0 1,0 -150,0
    //     `
    // } 
    // const circlePath = svg.append('g')
    //     .append('path')
    //     .attr('d', dCircle1)
    //     .style('opacity', 0.5)
    //     .on('mouseover', handleTween)
    
    function handleTween() {
        let start = this.getAttribute('d').split('L')[0].split(',').slice(0, 2).join(',')
        let bbox = this.getBBox()
        let centroidX = (bbox.x) + (bbox.width / 2)
        let centroidY = (bbox.y) + (bbox.height / 2)
        console.log(this.getAttribute('id'), centroidX, centroidY)

        const newShape = (t) => {
            return `
                M ${centroidX}, ${centroidY}
                L393.3172912597656 185.14239501953125
            `
        } 

        d3.select(this)
            .transition()
            .duration(1000)
            .style('opacity', 0.5)
            .attrTween('d', function () {
                return t => { return newShape(t) }
            })
    }
    

})