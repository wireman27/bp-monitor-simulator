/*
Based on the velocity increments, calculate the Bezier points
using similar increments in 't'.

At each point in time, each particle checks if it's really
close to the upperWalls of the artery (calculate 'y' for its current 'x')

If the particle is within a certain range,
make it bounce off based on the angle of the tangent
*/

let system;
let upperWall; let lowerWall;
let deClamp;

// Manage the state of the arterial wall clamping
deClamp = false;

// Credit to https://gist.github.com/atomizer/1049745 for the bezierPts function
function bezierPts(pts) {
  return function (t) {
    for (var a = pts; a.length > 1; a = b) // do..while loop in disguise
    {
      for (var i = 0, b = [], j; i < a.length - 1; i++) // cycle over control points
      {
        for (b[i] = [], j = 0; j < a[i].length; j++) // cycle over dimensions
        { b[i][j] = a[i][j] * (1 - t) + a[i + 1][j] * t; }
      }
    } // interpolation
    return a[0];
  };
}

function setup() {
  createCanvas(800, 800);
  system = new ParticleSystem(createVector(0, 400));

  // Emit 5 particles
  for (let i = 0; i < 5; i++) {
    system.addParticle();
  }

  upperWall = new ArterialWall(0, 300, 400, 300, 800, 300, 0);
  lowerWall = new ArterialWall(0, 500, 400, 500, 800, 500, 1);
}

function draw() {
  background(51);
  stroke(255);

  upperWall.run();
  lowerWall.run();

  // Add a bunch of blood cells at every heartbeat (assume 60 beats per second)
  if (frameCount % 30 == 0) {
    for (let i = 0; i < 5; i++) {
      system.addParticle();
    }
  }

  system.run();
}

// Define the particle system itself
let ParticleSystem = function (position) {
  this.origin = position.copy();
  this.particles = [];
};

ParticleSystem.prototype.addParticle = function () {
  this.particles.push(new Particle(createVector(0, random(335, 465))));
};

ParticleSystem.prototype.run = function () {
  for (let i = this.particles.length - 1; i >= 0; i--) {
    const p = this.particles[i];
    p.run();

    // Remove particles not in the viewframe
    if (p.isSquished || p.position.x < 0 || p.position.x > 800) {
      this.particles.splice(i, 1);
    }
  }
};

// Define a particle object
let Particle = function (position) {
  this.acceleration = createVector(random(0.005, 0.01), random(-0.005, 0.005));
  this.velocity = createVector(random(0.5, 1), random(-0.5, 1));
  this.position = position.copy();
  this.isSquished = false;
};

Particle.prototype.update = function () {
  /*
	Based on the direction of velocity
	make a decision on which arterial wall to assess

	This is slightly buggy because it won't capture particles
	whose 'rate of climb' is lower than the clamping of the walls.
	This causes the weird phenomenon where the particle appears outside
	the arterial walls.
	*/

  if (this.velocity.y < 0) {
    chosenWall = upperWall;
  } else {
    chosenWall = lowerWall;
  }
  let bounced = false;

  // For each bezier point in the chosen wall, we check
  // if a bounce is needed and how that bounce should work
  for (let i = 0; i < chosenWall.bezierPoints.length; i++) {
    const point = chosenWall.bezierPoints[i];
    if (abs(point[0] - this.position.x) <= 4) {
      const chosenPoint = chosenWall.bezierPoints[i];
      if (abs(chosenPoint[1] - this.position.y) < 7) {
        // Now that it's estalished that we are fairly close to the wall
        // We make a quick decision on whether we want to squishify the particle

        const otherWall = chosenWall == lowerWall ? upperWall : lowerWall;
        const tunnelWidth = abs(
          chosenWall.bezierPoints[i][1] - otherWall.bezierPoints[i][1],
        );

        if (tunnelWidth < 12) {
          this.isSquished = true;
        }

        const gradient = chosenWall.calcGradient(i);

        // Time to bounce
        // First, normalize the current acceleration and velocity
        const a = this.acceleration.copy().normalize();
        const b = this.velocity.copy().normalize();

        // Create the reflected vector
        a.reflect(gradient.normalize());
        b.reflect(gradient.normalize());

        // Invert the reflected vector
        a.mult(-1);
        b.mult(-1);

        this.acceleration.set(
          this.acceleration.rotate(a.heading() - this.acceleration.heading()),
        );
        this.velocity.set(
          this.velocity.rotate(b.heading() - this.velocity.heading()),
        );
        this.position.add(this.velocity);

        bounced = true;
      }

      break;
    }
  }

  if (bounced === false) {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
  }
};

Particle.prototype.display = function () {
  stroke(200);
  strokeWeight(2);
  fill(255, 0);
  ellipse(this.position.x, this.position.y, 12, 12);
};

Particle.prototype.run = function () {
  this.update();
  this.display();
};

Particle.prototype.isDead = function () {
  return this.lifespan < 0;
};

let ArterialWall = function (
  anchor1x,
  anchor1y,
  controlX,
  controlY,
  anchor2x,
  anchor2y,
  directionOfClamp,
)	{
  this.control = createVector(controlX, controlY);
  this.anchor1 = createVector(anchor1x, anchor1y);
  this.anchor2 = createVector(anchor2x, anchor2y);
  this.bezierPoints = [];
  this.directionOfClamp = directionOfClamp;
};

ArterialWall.prototype.update = function () {
  /*
	Currently very patchy. Manage the clamping
	of the arterial walls.
	*/

  if (this.bezierPoints.length > 0) {
    if (
      this.directionOfClamp == 1
			&& this.bezierPoints[100][1] < 400
			&& deClamp === false
    ) {
      deClamp = true;
      return;
    }
  }

  if (!deClamp) {
    if (this.directionOfClamp == 1) {
      this.control = this.control.sub(createVector(0, 0.2));
    } else {
      this.control = this.control.add(createVector(0, 0.2));
    }
  } else {
    if (
      this.directionOfClamp == 1
			&& this.bezierPoints[100][1] > 500
    ) {
      return;
    } if (
      this.directionOfClamp == 0
			&& this.bezierPoints[100][1] < 300) {
      return;
    }

    if (this.directionOfClamp == 1) {
      this.control = this.control.add(createVector(0, 0.2));
    } else {
      this.control = this.control.sub(createVector(0, 0.2));
    }
  }

  // Finally calculate the Bezier points
  this.calcBezierPoints();
};

ArterialWall.prototype.draw = function () {
  noFill();
  stroke(200);
  bezier(
    this.anchor1.x,
    this.anchor1.y,
    this.control.x,
    this.control.y,
    this.control.x,
    this.control.y,
    this.anchor2.x,
    this.anchor2.y,
  );
};

ArterialWall.prototype.run = function () {
  this.update();
  this.draw();
};

ArterialWall.prototype.calcBezierPoints = function () {
  this.bezierPoints = [];
  const tStep = 0.1;
  const b = bezierPts([
    [this.anchor1.x, this.anchor1.y],
    [this.control.x, this.control.y],
    [this.control.x, this.control.y],
    [this.anchor2.x, this.anchor2.y]]);

  for (let t = 0; t < 200; t++) {
    this.bezierPoints.push(b(t / 200));
  }
};

ArterialWall.prototype.calcGradient = function (indexOfChosenBezierPoint) {
  p1 = this.bezierPoints[indexOfChosenBezierPoint];
  p2 = this.bezierPoints[indexOfChosenBezierPoint + 1];

  const point2 = createVector(p1[0], p1[1]);
  let gradient;

  if (p2) {
    gradient = createVector(p2[0], p2[1]).sub(point2);
  } else {
    gradient = createVector(1, 1);
  }
  return gradient;
};
