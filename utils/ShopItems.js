const shopItems = [
    { id: 'front_wing', name: 'Carbon Front Wing', type: 'aero', boost: 2.5, cost: 250000, desc: 'Improves downforce and cornering.' },
    { id: 'rear_wing', name: 'DRS Rear Wing', type: 'aero', boost: 2.0, cost: 220000, desc: 'Increases top speed stability.' },
    { id: 'floor_edge', name: 'Venturi Floor Edge', type: 'aero', boost: 3.5, cost: 450000, desc: 'Extreme ground effect performance.' },
    { id: 'chassis_light', name: 'Mono Carbon Tub', type: 'chassis', boost: 5.0, cost: 850000, desc: 'Lightweight safety cell.' },
    { id: 'engine_turbo', name: 'Turbo Charger V8', type: 'engine_power', boost: 10.0, cost: 1250000, desc: 'Massive power increase.' },
    { id: 'pit_gun', name: 'Paoli High-Speed Gun', type: 'pit_crew', boost: 4.0, cost: 150000, desc: 'Faster wheel changes.' },
    { id: 'steering_wheel', name: 'Custom Steering Wheel', type: 'driver', boost: 1.5, cost: 95000, desc: 'Better control for drivers.' },
    { id: 'brake_ducts', name: 'Cooling Ducts', type: 'durability', boost: 2.5, cost: 80000, desc: 'Prevents brake fade.' },
    { id: 'sidepods', name: 'Zero-Sidepods', type: 'aero', boost: -1.0, cost: 50000, desc: 'Experimental. Use at your own risk!' },
    { id: 'diffuser', name: 'Double Diffuser', type: 'aero', boost: 6.0, cost: 900000, desc: 'Controversial but FAST.' },
    { id: 'brakes_carbon', name: 'Carbon-Carbon Brakes', type: 'durability', boost: 4.0, cost: 200000, desc: 'Supreme stopping power.' },
    { id: 'fuel_pump', name: 'High-Flow Fuel Pump', type: 'engine_power', boost: 2.0, cost: 110000, desc: 'Consistent fuel delivery.' },
    { id: 'radiator', name: 'Compact Radiator', type: 'durability', boost: 1.5, cost: 75000, desc: 'Improved thermal efficiency.' },
    { id: 'exhaust', name: 'Titanium Exhaust', type: 'engine_power', boost: 3.0, cost: 300000, desc: 'Reduced backpressure and lighter.' },
    { id: 'suspension_push', name: 'Pushrod Suspension', type: 'chassis', boost: 2.5, cost: 180000, desc: 'Rigid and precise!' },
    { id: 'halo', name: 'Titanium Halo', type: 'durability', boost: 10.0, cost: 100000, desc: 'Required safety equipment.' },
    { id: 'wheel_nuts', name: 'Captive Wheel Nuts', type: 'pit_crew', boost: 2.0, cost: 120000, desc: 'Reduced cross-threading.' },
    { id: 'tires_warmers', name: 'Tyre Warmers', type: 'strategy', boost: 3.0, cost: 140000, desc: 'Start fast after pitstops.' },
    { id: 'ice_box', name: 'Drivers Drink Bottle', type: 'driver', boost: 0.5, cost: 5000, desc: 'No, Kimi, you will not have the drink.' },
    { id: 'merch', name: 'Official Team Cap', type: 'money', boost: 1.1, cost: 15000, desc: 'Boost team revenue from merch!' }
];

for(let i=1; i<=80; i++) {
    shopItems.push({ id: `item_${i}`, name: `Bolt #${i+100}`, type: 'chassis', boost: 0.01, cost: 500, desc: 'Just a bolt.' });
}

module.exports = { shopItems };
