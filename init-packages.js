const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
 
// [name, destination, state, category, days, price, description, highlights]
const DATA = [
 ['Manali Mountain Escape','Manali','Himachal Pradesh','Mountains',5,8999,'Experience beautiful mountains and peaceful valleys.','Solang Valley,Rohtang Pass,Hadimba Temple,Old Manali cafes'],
 ['Kerala Backwater Tour','Kerala','Kerala','Nature',6,12999,'Enjoy scenic backwaters and beautiful greenery.','Alleppey houseboat,Kochi Fort,Kumarakom birds,Ayurvedic spa'],
 ['Royal Rajasthan Tour','Jaipur','Rajasthan','Heritage',4,7499,'Explore royal palaces, forts and rich heritage.','Amber Fort,Hawa Mahal,City Palace,Bazaar walk'],
 ['Goa Beach Holiday','Goa','Goa','Beaches',4,9499,'Relax on beautiful beaches and explore coastal culture.','Baga & Calangute,Old Goa churches,Dudhsagar Falls,Sunset cruise'],
 ['Golden Jaisalmer Desert Safari','Jaisalmer','Rajasthan','Heritage',4,8499,'Camel safaris, golden forts and starry desert nights.','Jaisalmer Fort,Sam Sand Dunes,Camel safari,Folk night camp'],
 ['Srinagar Paradise Getaway','Srinagar','Jammu & Kashmir','Mountains',5,14999,'Shikara rides, Mughal gardens and Himalayan views.','Dal Lake shikara,Houseboat stay,Mughal Gardens,Gulmarg day trip'],
 ['Shillong Meghalaya Trail','Shillong','Meghalaya','Nature',5,11999,'Living root bridges, waterfalls and misty hills.','Elephant Falls,Mawlynnong village,Dawki river,Umiam Lake'],
 ['Puri Jagannath & Beach Retreat','Puri','Odisha','Spiritual',3,6499,'Sacred temples and a peaceful Odisha coastline.','Jagannath Temple,Konark Sun Temple,Puri beach,Chilika Lake'],
 ['Hampi Heritage Discovery','Hampi','Karnataka','Heritage',3,6999,'Walk through the ruins of the Vijayanagara empire.','Virupaksha Temple,Stone Chariot,Matanga Hill sunrise,Coracle ride'],
 ['Amritsar Golden Temple Tour','Amritsar','Punjab','Spiritual',3,5999,'Spiritual peace, Punjabi food and border ceremony.','Golden Temple,Wagah Border,Jallianwala Bagh,Langar experience'],
 ['Rishikesh Adventure & Yoga','Rishikesh','Uttarakhand','Spiritual',4,7999,'Yoga by the Ganges plus rafting and camping.','River rafting,Ganga Aarti,Laxman Jhula,Yoga sessions'],
 ['Leh Ladakh Expedition','Leh','Ladakh','Mountains',7,24999,'High-altitude lakes, monasteries and epic road trips.','Pangong Lake,Nubra Valley,Khardung La,Thiksey Monastery'],
 ['Ooty Nilgiri Hills Holiday','Ooty','Tamil Nadu','Nature',4,7299,'Tea gardens, toy train and cool hill air.','Nilgiri toy train,Botanical Garden,Doddabetta Peak,Tea factory'],
 ['Munnar Tea Hills Retreat','Munnar','Kerala','Nature',4,8299,'Rolling tea estates and misty mountain stays.','Tea plantations,Eravikulam Park,Mattupetty Dam,Top Station'],
 ['Mumbai City Highlights','Mumbai','Maharashtra','City',3,8799,'Gateway of India, Bollywood and street food.','Gateway of India,Marine Drive,Elephanta Caves,Street food walk'],
 ['Varanasi Spiritual Journey','Varanasi','Uttar Pradesh','Spiritual',3,5499,'Ganga aarti, ancient ghats and timeless lanes.','Dashashwamedh Aarti,Sunrise boat ride,Kashi Vishwanath,Sarnath'],
 ['Darjeeling Himalayan Escape','Darjeeling','West Bengal','Mountains',5,10499,'Tea gardens, toy train and Kanchenjunga sunrise.','Tiger Hill sunrise,Toy train,Tea estate visit,Batasia Loop'],
 ['Shimla Colonial Charm','Shimla','Himachal Pradesh','Mountains',4,7799,'Colonial streets, pine forests and snowy views.','Mall Road,Kufri,Jakhu Temple,Toy train'],
 ['Udaipur City of Lakes','Udaipur','Rajasthan','Heritage',4,9999,'Lakeside palaces and romantic sunsets.','City Palace,Lake Pichola boat,Jag Mandir,Sajjangarh sunset'],
 ['Agra Taj Mahal Experience','Agra','Uttar Pradesh','Heritage',3,6299,'Taj Mahal at sunrise plus Mughal heritage.','Taj Mahal sunrise,Agra Fort,Mehtab Bagh,Fatehpur Sikri']
];
 
function initPackages(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS tour_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    destination TEXT NOT NULL,
    state TEXT,
    category TEXT DEFAULT 'Nature',
    days INTEGER NOT NULL,
    nights INTEGER NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    highlights TEXT,
    image TEXT,
    featured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  const count = db.prepare('SELECT COUNT(*) c FROM tour_packages').get().c;
  if (count > 0) return console.log('Packages already seeded.');
  const ins = db.prepare(`INSERT INTO tour_packages
    (name,destination,state,category,days,nights,price,description,highlights,image,featured)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  db.transaction(() => DATA.forEach((d, i) =>
    ins.run(d[0], d[1], d[2], d[3], d[4], d[4] - 1, d[5], d[6], d[7],
            `images/${slug(d[1])}.jpg`, i < 4 ? 1 : 0)))();
  console.log('Seeded ' + DATA.length + ' packages.');
}
module.exports = initPackages;
 