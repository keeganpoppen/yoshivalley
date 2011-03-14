(function(){
    //Put all numerical constants here
    YV.Constants = (function() {
        var arenaRadius = 50;
        var sunRadius = arenaRadius / 15;
        var neptuneRadius = sunRadius * 0.6;
        var saturnRadius = sunRadius * 0.7;
        var jupiterRadius = sunRadius * 0.9;
        var earthRadius = sunRadius * 0.7;
        var marsRadius = sunRadius * 0.6;
        var ufoRadius = sunRadius * 0.4;

        var earthOrbit = 2 * arenaRadius / 7;
        var marsOrbit = 3 * arenaRadius / 7;
        var jupiterOrbit = 4 * arenaRadius / 7;
        var saturnOrbit = 5 * arenaRadius / 7;
        var neptuneOrbit = 6 * arenaRadius / 7;

        var sunMass = 20;
        var jupiterMass = 0.8 * sunMass;
        var saturnMass = 0.4 * sunMass;
        var neptuneMass = 0.6 * sunMass;
        var earthMass = 0.5 * sunMass;
        var marsMass = 0.4 * sunMass;
        var ufoMass = 0.2 * sunMass;

        var fieldOfView = 60.0;
        var cameraRadius = Math.abs(2.5 * arenaRadius / Math.tan(sglDegToRad(fieldOfView)));
    
        var constants = {
            maxPlayers: 8,
            planetSphereDensity: 25,
            maxFrameRate: 60,
            arenaRadius: arenaRadius,
            arenaKickbackMultiplier: 150,

            ufo: {
                mass: ufoMass,
                radius: ufoRadius,
                lives: 3,
                rechargeTime: 0.8,
                invulnerablePeriod: 3,
                initialRadius: 0.8 * arenaRadius,
                initialVelocity: ufoRadius,

                collisionEpsilon: ufoRadius/4,

                minMaxAngle: 60.0,
                controlVelocityMultiplier: 20,

                blinkPeriod: 0.3,
                blinkOffPercent: 0.33,
                shininess: 20.0,

                diskSquishFrac: 0.3,
                domeRadFrac: 0.6,
                ringRadius: 1.3 * ufoRadius,
            },

            particle: {
                lifetime: 1,
            },

            explosion: {
                finalRadius: 20 * ufoRadius,
                radiusVariability: 0.2,
                lifetime: 4,
                vertexDensity: 20,
                particleSize: 600,
            },

            camera: {
                fov: fieldOfView, //Degrees
                orbitRadius: cameraRadius,
                orbitAngle: 0.0,
                near: 0.1,
                far: 3*cameraRadius,
                azimuth: 70,
            },

            planets : {
                orbitVelocity: 200,

                sun: {
                    radius: sunRadius,
                    mass: sunMass,
                },

                earth: {
                    radius : earthRadius,
                    mass : earthMass,
                    tilt: 5.0, //Degrees
                    rotationalVelocity: 8.0, //Degrees per second
                    orbitRadius: earthOrbit,
                    orbitAngle: 180.0,
                },

                mars: {
                    radius: marsRadius,
                    mass: marsMass,
                    tilt: 3.0,
                    rotationalVelocity: 5.0,
                    orbitRadius: marsOrbit, 
                    orbitAngle: 25.0
                },

                jupiter: {
                    radius: jupiterRadius,
                    mass: jupiterMass,
                    tilt: 0.0,
                    rotationalVelocity: 6.0,
                    orbitRadius: jupiterOrbit,
                    orbitAngle: -30,
                },

                saturn: {
                    radius: saturnRadius,
                    mass: saturnMass,
                    tilt: 15.0,
                    rotationalVelocity: 12.0,
                    orbitRadius: saturnOrbit,
                    orbitAngle: 270.0,
                },

                neptune: {
                    radius: neptuneRadius,
                    mass: neptuneMass,
                    tilt: 1.0,
                    rotationalVelocity: 8.0,
                    orbitRadius: neptuneOrbit,
                    orbitAngle: 125.0,
                },
            },

            laser: {
                length: ufoRadius,
                numParticles: 10,
                velocityMultiplier: 40,
                maxAge: 4,
                particleSize: 300,
            },

            solver: {
                timestep: 0.03,
                gravitationalConstant: 40.0,
            },
        };
        return constants;
    })();
})();
