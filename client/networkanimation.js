let sketch = function(p) {
    let nodes = [];
    let numNodes = 5
    let maxNodes = 10;
    let maxDist = 50;
    let maxSpeed = 1;
    let maxRadius = 10;

    p.setup = function() {
        p.createCanvas(p.windowWidth, p.windowHeight);
        for (let i = 0; i < numNodes; i++) {
            nodes.push(new Node(p.random(p.width), p.random(p.height)));
        }
    }

    p.draw = function() {

        // limit nodes to maxNodes (delete oldest)
        if (nodes.length > maxNodes) {
            const toRemove = nodes.length - maxNodes;
            for (let i = 0; i < toRemove; i++) {
                nodes[0].remove();
            }
        }
    
        p.background(0);
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].update();
            nodes[i].display();
        }
        if (nodes.length < maxNodes) {
            if (p.random(1) < 0.01) {
                nodes.push(new Node(p.width / 2 + p.random(-1, 1), p.height / 2 + p.random(-1, 1)));
            }
        }


        if(p.frameCount % 100 == 0){

       
        if (nodes.length >= maxNodes) {
            let randomNode = p.random(nodes);
            randomNode.initializeRandomState();
        }
        }

    }
        
        
    

    class Node {
        constructor(x, y) {
            this.pos = p.createVector(x, y);
            this.vel = p5.Vector.random2D();
            this.vel.mult(p.random(maxSpeed));
            this.acc = p.createVector(0, 0);
            this.radius = p.random(2, maxRadius);
            this.connections = [];
            // for (let i = 0; i < nodes.length; i++) {
            //     if (nodes[i] != this) {
            //         let d = p.dist(this.pos.x, this.pos.y, nodes[i].pos.x, nodes[i].pos.y);
            //         if (d < maxDist*2 && p.random(1) < 0.5) {
            //             this.connections.push(nodes[i]);
            //             nodes[i].connections.push(this);
            //         }
            //     }
            // }

            // connect with other nodes, probability of connection is proportional to number of connections
            const numberOfConnections = nodes.map(node => node.connections.length);
            const sumOfConnections = numberOfConnections.reduce((a, b) => a + b, 0);
            const numberOfNodes = nodes.length;
            const probabilityOfConnection = numberOfConnections.map(connections => connections / sumOfConnections / numberOfNodes);
            const totalProbability = probabilityOfConnection.reduce((a, b) => a + b, 0);
            // normalize probability of connection to sum to 1 if run for all nodes


            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i] != this) {
                    let d = p.dist(this.pos.x, this.pos.y, nodes[i].pos.x, nodes[i].pos.y);
                    if (p.random(1) < probabilityOfConnection[i]) {
                        this.connections.push(nodes[i]);
                        nodes[i].connections.push(this);
                    }
                }
            }

            // if not connected to any other nodes, connect to random node
            if (this.connections.length == 0 && nodes.length > 1) {
                let other = p.random(nodes);
                this.connections.push(other);
                other.connections.push(this);
            }

        }

        initializeRandomState() {


            this.pos = p.createVector(p.random(p.width), p.random(p.height));
            this.vel = p5.Vector.random2D();
            this.vel.mult(p.random(maxSpeed));
            this.acc = p.createVector(0, 0);
            this.radius = p.random(2, maxRadius);

            // remove all connections
            for (let i = this.connections.length - 1; i >= 0; i--) {
                // remove connection from other node
                this.connections[i].connections.splice(this.connections[i].connections.indexOf(this), 1);
                // remove connection from this node
                this.connections.splice(i, 1);
            }
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i] != this) {
                    let d = p.dist(this.pos.x, this.pos.y, nodes[i].pos.x, nodes[i].pos.y);
                    if (d < maxDist*4 && p.random(1) < 0.5) {
                        this.connections.push(nodes[i]);
                        nodes[i].connections.push(this);
                    }
                }
            }
            // if not connected to any other nodes, connect to random node
            if (this.connections.length == 0 && nodes.length > 1) {
                let other = p.random(nodes);
                this.connections.push(other);
                other.connections.push(this);
            }


        }

        remove() {
            for (let i = this.connections.length - 1; i >= 0; i--) {
                this.connections[i].connections.splice(this.connections[i].connections.indexOf(this), 1);
            }
            nodes.splice(nodes.indexOf(this), 1);
        }


        update() {



            // if near edge, move towards center
            if (this.pos.x < 20 || this.pos.x > p.width-20 || this.pos.y < 20 || this.pos.y > p.height-20) {
                this.moveTowardsCenter(0.3);
            }else{
            this.escapeMouse(0.8, 100);
            this.springConnections(0.5);
            this.avoidOthers(0.05, 200);
            }
            this.acc.mult(0.4);
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.vel.mult(0.95);
            if (this.pos.x < 0 || this.pos.x > p.width) {
                this.vel.x *= -1;
            }
            if (this.pos.y < 0 || this.pos.y > p.height) {
                this.vel.y *= -1;
            }
            for (let i = this.connections.length - 1; i >= 0; i--) {
                if (!nodes.includes(this.connections[i])) {
                    this.connections.splice(i, 1);
                }
            }
        }

        display() {
            // neon magenta
            p.fill(255, 0, 255, 100);
            p.stroke(255, 0, 100);
            p.strokeWeight(0.4);
            p.ellipse(this.pos.x, this.pos.y, this.radius * 2);
            for (let i = 0; i < this.connections.length; i++) {
                p.line(this.pos.x, this.pos.y, this.connections[i].pos.x, this.connections[i].pos.y);
            }
        }

        moveTowardsCenter(strength) {
            let target = p.createVector(p.width / 2, p.height / 2);
            let dir = p5.Vector.sub(target, this.pos);
            dir.normalize();
            dir.mult(strength);
            this.acc = dir;
        }

        followMouse(speed) {
            let target = p.createVector(p.mouseX, p.mouseY);
            let dir = p5.Vector.sub(target, this.pos);
            dir.normalize();
            dir.mult(speed);
            this.acc = dir;
        }

        escapeMouse(strength, upToDist) {
            let target = p.createVector(p.mouseX, p.mouseY);
            let dir = p5.Vector.sub(this.pos, target);
            let d = dir.mag();
            if (d < upToDist) {
                dir.normalize();
                dir.mult(strength);
                this.acc = dir;
            }
        }

        springConnections(strength) {
            for (let i = 0; i < this.connections.length; i++) {
                let target = this.connections[i].pos.copy();
                target.sub(this.pos);
                let d = target.mag();
                target.normalize();
                target.mult(strength);
                target.mult((d - maxDist) / d);
                this.acc.add(target);
            }
        }

        avoidOthers(strength, upToDist) {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i] != this) {
                    let dir = p5.Vector.sub(this.pos, nodes[i].pos);
                    let d = dir.mag();
                    if (d < upToDist) {
                        dir.normalize();
                        dir.mult(strength);
                        this.acc.add(dir);
                    }
                }
            }
        }
    }

    p.mousePressed = function() {
        nodes.push(new Node(p.mouseX, p.mouseY));
    }

    p.keyPressed = function() {
        if (p.key == ' ') {
            nodes = [];
        }
    }

    p.windowResized = function() {

        p.resizeCanvas(p.windowWidth, p.windowHeight);
    }

    
}



// new p5(sketch);  
