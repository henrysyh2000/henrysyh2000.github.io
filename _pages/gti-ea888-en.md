---
title: "EA888 evo4: the engine, layer by layer"
layout: single
permalink: /en/life/gti/ea888-evo4/
lang: en
locale: en
classes: [blog-reading, blog-with-toc, gti-chapter]
life_page: gti-mark-8
author_profile: false
toc: true
toc_sticky: true
toc_label: "On this page"
read_time: false
share: false
related: false
excerpt: "Where the EA888 came from, why its second generation became famous for breaking, and what each layer of the evo4 in my GTI does, pulled apart along its vertical axis and drawn from the factory repair manual."
---

<p class="gti-chapter-kicker">GTI Mark 8 · 01 / Powertrain</p>

My car is a Canadian-market 2024 Golf GTI, and its engine is an EA888 evo4. Before taking it apart, a few words on where this engine comes from.

## Starting with the history

> The story before the fourth generation comes from public sources and what is commonly said among enthusiasts. The Volkswagen documents I have don't cover it, and different sources put the years a year or two apart.

EA888 is Volkswagen's family of four-cylinder turbocharged direct-injection petrol engines. It arrived around 2007 to replace the EA113, and it moved the camshaft drive from a belt to a chain. The evo4 in my car is the fourth generation.

**The first generation** (around 2007) already had problems of its own, the timing chain tensioner for one.

**The second generation** (from 2008) is the famous one, and what it is famous for is breaking. The most common complaint was burning oil, usually put down to the piston rings, especially the design of the oil scraper ring. Next came the timing chain tensioner; in bad cases the chain jumped a tooth. In those years plenty of cars in China ran this engine and plenty of people were fixing it, hence the joke 「修 EA888，直接富三代」: fix EA888s, and your family is rich for three generations.

**The third generation** (around 2012, arriving with the MQB platform) is where Volkswagen changed a lot. Several of those changes are still there on my evo4. The exhaust manifold is built into the cylinder head, and the turbocharger mounts directly on the head's exhaust outlet with four studs (repair manual PDF 343–344). The coolant flow is controlled by the thermal management module N493 (PDF 286). Boost pressure is regulated by an electric actuator, GX34 (PDF 341, 358).

**The fourth generation, evo4** (the Golf 8 generation), is a very mature one. In Volkswagen's own words, to cut emissions further and improve performance, this generation got new injectors, a maximum injection pressure raised to 350 bar, lower internal friction and better acoustics (SSP 822223, p. 4). Look closely at its list of changes and one item lines up exactly with the second generation's famous problem: the timing chain tensioner gets a new one-way valve and a new bushing (SSP 822223, pp. 6, 10). Volkswagen doesn't say this has anything to do with the old trouble. That part is my own reading: the same component was still being changed in the fourth generation.

The evo4 has a cast-iron block, which is strong and dependable. (The cast iron is not stated in the Volkswagen documents I have; it comes from public information on the EA888 family.) Among enthusiasts it is widely agreed to have strong tuning potential. Volkswagen itself gives a point of reference: with the same 1984 cc and the same bore and stroke, the GTI is tuned to 180 kW and the Golf R to 235 kW (SSP 822223, p. 4).

## A few numbers that help

These numbers come from the repair manual and the self-study programmes. I picked only the ones that help in understanding this engine.

- **Displacement 1984 cc** (SSP 822223, p. 4), bore 82.5 mm, stroke 92.8 mm (manual PDF 18, 20). The stroke is longer than the bore, a long-stroke design, which generally favours torque at low and middle engine speeds (general engineering knowledge, not a Volkswagen statement).
- **Compression ratio 9.6:1** (GTI, SSP 822223, p. 4). The turbocharger has already compressed the intake air once, so the compression ratio has to be somewhat lower than in a naturally aspirated engine, to avoid knock (general knowledge). The manual lists two engine codes at 180 kW, one at 9.3:1 and one at 9.6:1; I haven't yet confirmed which code my car has.
- **Four valves per cylinder**, sixteen in all. The intake valve head is 33.85 mm across, the exhaust valve head 28 mm (PDF 24). The intake valves are larger because drawing air in is harder than pushing exhaust gas out (general knowledge).
- **Firing order 1-3-4-2** (PDF 18, 20).
- **Timing chain of 170 links**, the same as the third generation's (SSP 822223, p. 9).

## How to read the figure

The figure below pulls the engine apart along its vertical axis, layer by layer: 24 layers, from the ignition coils at the top to the oil pan at the bottom. Select any layer to see what it is and what numbers the manual gives for it. Drag the figure, or use **Turn**, to look at it from any side; **Picture view** returns to the angle of the factory picture.

Assembled, the engine is seen from the same angle as the picture on the cover of SSP 822223: the turbocharger on the exhaust side, which faces the cabin, and the transmission end on the left. Open the hood and look from the front of the car, and you see the other side, the intake side.

<figure class="gti-reference">
  <img src="{{ '/assets/gti/ea888-reference.png' | relative_url }}" alt="The assembled EA888 evo4 engine, seen from the exhaust side with the transmission end on the left, the turbocharger at the front and the ignition coils on top" width="341" height="405" loading="lazy">
  <figcaption>The assembled EA888 evo4, as pictured on the cover of Volkswagen self-study programme 822223. Reference image supplied by the author.</figcaption>
</figure>

The figure leaves out the wiring, hoses and pipes. When an engine is taken apart, these come off first, and what is left is the engine's own structure. The parts are shaped after the part drawings in the repair manual; where the manual gives no dimension, the panel says whether a size was measured from a drawing or simply drawn.

{% include gti-exploded-en.html %}
<script src="{{ '/assets/gti/ea888-exploded.js' | relative_url }}?v={{ site.time | date: '%s' }}" defer></script>

## What each layer does, from the top down

The order is roughly the order in which the manual takes the engine apart. Tightening torques and sequences are not listed here: for actual repairs, the repair manual is the reference, and the page numbers in brackets make it easy to find the right place in it.

**Ignition coils and spark plugs.** One coil per cylinder, sitting directly on its spark plug, with no high-tension leads. They are the first things to come off when the engine is taken apart.

**Oil separator.** The oily gases that escape into the crankcase have their oil separated out here: the oil goes back to the oil pan, and the gases go back into the intake to be burned. It sits next to the coils of cylinders 3 and 4, so those two coils have to come out before it can be removed (PDF 251–252).

**Cylinder head cover and camshafts.** On the evo4 both camshafts are mounted in the cylinder head cover, so the cover comes off together with the camshafts; the manual even warns not to let the camshafts fall out of it (PDF 196–197). The intake camshaft has a pair of lobes for each cylinder. The exhaust camshaft has, for each cylinder, a cam piece that can slide sideways and carries lobes of two different lifts; actuators on the cylinder head cover push it across to switch between them (PDF 189–190). The oil filler is on the upper cover at the timing end (PDF 158–160).

**Cylinder head.** The valves, valve springs, roller rocker levers and hydraulic lifters all live here. One end of each rocker lever presses on a valve and the other rests on a lifter; when the cam pushes down on the roller in the middle, the valve opens. The hydraulic lifters take up the clearance by themselves, so the manual has no step for adjusting valve clearance. On its exhaust side the head carries the built-in exhaust manifold, and the turbocharger mounts directly onto it.

**Turbocharger.** On the exhaust side, facing the cabin, so you can't see it from the front with the hood open. The exhaust gas spins the turbine, and the compressor on the same shaft compresses air and sends it into the engine; how much boost it makes is controlled by GX34. To take it off, the heat shield above it has to come off before the oil supply line can be removed (PDF 353–354).

**Intake manifold and throttle.** On the intake side, the side you see when you open the hood.

**Timing end.** There are three chains here: the camshaft timing chain, the balance shaft drive chain and the oil pump drive chain (SSP 822223, pp. 9–11). This is the end where the second generation's famous timing problems happened. On the outside, the accessory bracket carries the oil filter, the generator and the A/C compressor, and the ribbed belt runs around the vibration damper, the tensioner, the generator and the A/C compressor in turn (PDF 82–84).

**Cooling.** On the intake side, toward the transmission end, sit the thermal management module N493 and the coolant pump. The coolant pump is driven by a toothed belt from the intake-side balance shaft (PDF 286). The radiator belongs to the car's front end and is connected to the engine only by hoses (PDF 266, 312).

**Cylinder block.** Cast iron, four cylinders, with one balance shaft on the intake side and one on the exhaust side (PDF 118). The balance shafts turn at twice crankshaft speed to cancel the second-order vibration that a four-cylinder engine has by nature (general knowledge).

**Pistons, piston rings and connecting rods.** Each piston has three rings. The two compression rings seal the combustion chamber, and the oil scraper ring scrapes excess oil off the cylinder wall and sends it back down. That last ring is where, according to public sources, the second generation's oil burning came from. The connecting rod's big end is fracture-split: the cap is broken off the rod, so the two fracture faces interlock and the cap fits back in only one position. To take the pistons out, the cylinder head comes off first, and they come out through the top of the block.

**Crankshaft and flywheel.** The crankshaft has four counterweights (SSP 893213, p. 15). The vibration damper sits at the timing end and the flywheel at the transmission end, held by six or eight bolts depending on the version (PDF 99).

**Oil pan.** The upper section is aluminium and the lower section plastic (SSP 893213, p. 15). The oil pump sits inside the oil pan and is driven from the crankshaft by a chain (PDF 233).

## What the manual doesn't say

The repair manual is written for inspection and assembly, and many design dimensions are not printed in it: the connecting rod's centre distance, the piston's compression height and pin diameter, the grade of the block material, the cam profiles and lift, the flywheel specification for my car, and so on. Wherever the figure uses one of these, the panel labels it **Unknown** or **Drawing**.

## Sources

- **M1:** EA888 evo4 repair manual (erWin, edition 08/2026). All page numbers in this chapter follow the PDF's page order; the manual's printed page numbers are 10 lower.
- **SSP 893213:** self-study programme for the 2022 GTI and Golf R (pages in PDF order).
- **SSP 822223:** self-study programme for the 2.0L EA888 evo4 engine, version 1.3 (November 2022; pages in PDF order).
- The history of the first three generations: public sources and what enthusiasts say, not checked against factory documents.

<p class="gti-return"><a href="{{ '/' | relative_url }}#gti-mark-8">← Back to GTI Mark 8</a></p>
