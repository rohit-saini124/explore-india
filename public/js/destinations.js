
const destinations = [
    {
        name: "Manali",
        state: "Himachal Pradesh",
        category: "Mountains",
        description: "Beautiful mountains and snowy landscapes.",
        image: [
            "images/manali1.jpg",
            "images/manali2.jpg",
            "images/manali3.jpg",
            "images/manali4.jpg",
            "images/manali5.jpg"
        ]
    },
    {
        name: "Goa",
        state: "Goa",
        category: "Beaches",
        description: "Famous for beaches and scenic views.",
        image: [
            "images/goa1.jpg",
            "images/goa2.jpg",
            "images/goa3.jpg",
            "images/goa4.jpg",
            "images/goa5.jpg"
        ]
    },
    {
        name: "Jaipur",
        state: "Rajasthan",
        category: "Heritage",
        description: "Explore forts, palaces and royal history.",
        image: [
            "images/jaipur5.jpg",
            "images/jaipur2.jpg", 
            "images/jaipur3.jpg",
            "images/jaipur4.jpg", 
            "images/jaipur1.jpg",
            "images/jaipur6.jpg"
        ]
    },
    {
        name: "Kerala",
        state: "Kerala",
        category: "Nature",
        description: "Discover greenery and beautiful backwaters.",
        image: [
            "images/kerala1.jpg",
            "images/kerala2.jpg",
            "images/kerala3.jpg",
            "images/kerala4.jpg",
            "images/kerala5.jpg",
            "images/kerala6.jpg"
        ]
    },
    {
        name: "Agra",
        state: "Uttar Pradesh",
        category: "Heritage",
        description: "Home of the magnificent Taj Mahal.",
        image: [
            "images/agra1.jpg",
            "images/agra2.jpg",
            "images/agra3.jpg",
            "images/agra4.jpg"
        ]
    },
    {
        name: "Udaipur",
        state: "Rajasthan",
        category: "Heritage",
        description: "Beautiful lakes and historic palaces.",
        image: [
            "images/udaipur1.jpg",
            "images/udaipur2.jpg",
            "images/udaipur3.jpg",
            "images/udaipur4.jpg",
            "images/udaipur5.jpg",
            "images/udaipur6.jpg"
        ]
    },
    {
        name: "Shimla",
        state: "Himachal Pradesh",
        category: "Mountains",
        description: "A charming hill station in the Himalayas.",
        image: [
            "images/shimla1.jpg",
            "images/shimla2.jpg",
            "images/shimla3.jpg",
            "images/shimla4.jpg",
            "images/shimla5.jpg",
            "images/shimla6.jpg",
            "images/shimla7.jpg"
        ]
    },
    {
        name: "Darjeeling",
        state: "West Bengal",
        category: "Mountains",
        description: "Famous for tea gardens and mountain views.",
        image: [
            "images/darjeeling1.jpg",
            "images/darjeeling2.jpg",
            "images/darjeeling3.jpg",
            "images/darjeeling4.jpg",
            "images/darjeeling5.jpg"
        ]
    },
    {
        name: "Varanasi",
        state: "Uttar Pradesh",
        category: "Spiritual",
        description: "An ancient city on the banks of the Ganges.",
        image: [
            "images/varanshi1.jpg",
            "images/varanshi2.jpg",
            "images/varanshi3.jpg",
            "images/varanshi4.jpg",
            "images/varanshi5.jpg"
        ]
    },
    {
        name: "Mumbai",
        state: "Maharashtra",
        category: "City",
        description: "Explore India's vibrant financial capital.",
        image: [
            "images/mumbai1.jpg",
            "images/mumbai2.jpg",
            "images/mumbai3.jpg",
            "images/mumbai4.jpg",
            "images/mumbai5.jpg",
            "images/mumbai6.jpg"
        ]
    },
    {
        name: "Munnar",
        state: "Kerala",
        category: "Nature",
        description: "Scenic hills and lush tea plantations.",
        image: [
            "images/munnar1.jpg",
            "images/munnar2.jpg",
            "images/munnar3.jpg",
            "images/munnar4.jpg",
            "images/munnar5.jpg"
        ]
    },
    {
        name: "Ooty",
        state: "Tamil Nadu",
        category: "Mountains",
        description: "A peaceful hill station with green landscapes.",
        image: [
            "images/ooty1.jpg",
            "images/ooty2.jpg",
            "images/ooty3.jpg",
            "images/ooty4.jpg",
            "images/ooty5.jpg",
            "images/ooty6.jpg"
        ]
    },
    {
        name: "Leh",
        state: "Ladakh",
        category: "Mountains",
        description: "Discover Himalayan landscapes and monasteries.",
       image: [
            "images/leh1.jpg",
            "images/leh2.jpg",
            "images/leh3.jpg",
            "images/leh4.jpg",
            "images/leh5.jpg"
       ]
    },
    {
        name: "Rishikesh",
        state: "Uttarakhand",
        category: "Rivers",
        description: "Known for river views and spiritual tourism.",
        image: [
            "images/rishikesh1.jpg",
            "images/rishikesh2.jpg",
            "images/rishikesh3.jpg",
            "images/rishikesh4.jpg",
            "images/rishikesh5.jpg",
            "images/rishikesh6.jpg"
        ]
    },
    {
        name: "Amritsar",
        state: "Punjab",
        category: "Spiritual",
        description: "Visit the iconic Golden Temple.",
        image: [
            "images/amritsar1.jpg",
            "images/amritsar2.jpg",
            "images/amritsar3.jpg",
            "images/amritsar4.jpg",
            "images/amritsar5.jpg",
            "images/amritsar6.jpg"
        ]
    },
    {
        name: "Hampi",
        state: "Karnataka",
        category: "Heritage",
        description: "Explore ancient temples and historic ruins.",
        image: [
            "images/hampi1.jpg",
            "images/hampi2.jpg",
            "images/hampi3.jpg",
            "images/hampi4.jpg",
            "images/hampi5.jpg",
            "images/hampi6.jpg"
        ]
    },
    {
        name: "Puri",
        state: "Odisha",
        category: "Spiritual",
        description: "Famous for its beaches and Jagannath Temple.",
        image: [
            "images/puri1.jpg",
            "images/puri2.jpg",
            "images/puri3.jpg",
            "images/puri4.jpg",
            "images/puri5.jpg",
            "images/puri6.jpg"
        ]
    },
    {
        name: "Shillong",
        state: "Meghalaya",
        category: "Nature",
        description: "Known for green hills and scenic waterfalls.",
        image: [
            "images/shillong1.jpg",
            "images/shillong2.jpg",
            "images/shillong3.jpg",
            "images/shillong4.jpg",
            "images/shillong5.jpg"
        ]
    },
    {
        name: "Srinagar",
        state: "Jammu and Kashmir",
        category: "Nature",
        description: "Beautiful lakes, gardens and mountain scenery.",
        image: [
            "images/srinagar1.jpg",
            "images/srinagar2.jpg",
            "images/srinagar3.jpg",
            "images/srinagar4.jpg",
            "images/srinagar5.jpg",
            "images/srinagar6.jpg"
        ]
    },
    {
        name: "Jaisalmer",
        state: "Rajasthan",
        category: "Heritage",
        description: "Discover golden forts and desert landscapes.",
        image: [
            "images/jaisalmer1.jpg",
            "images/jaisalmer2.jpg",
            "images/jaisalmer3.jpg",
            "images/jaisalmer4.jpg",
            "images/jaisalmer5.jpg"
        ]
    }
];
const container = document.getElementById("destinationContainer");
function displayDestinations(destinationList) {
    container.innerHTML = "";
    destinationList.forEach(destination => {
        const card = document.createElement("div");
        card.className = "destination-card";
      const photos = destination.image;
        let currentImageIndex = 0;
        card.innerHTML = `

            <div class="image-slider">
                <img class="destination-image"
                     src="${photos[0]}"
                     alt="${destination.name}">
                ${photos.length > 1 ? `
                    <button class="prev-btn">❮</button>
                    <button class="next-btn">❯</button>
                ` : ""}
            </div>

            <h3>${destination.name}</h3>
            <p><strong>State:</strong> ${destination.state}</p>
            <p>${destination.description}</p>
            <button class="package-btn">View Packages</button>
        `;
        const image = card.querySelector(".destination-image");
        const prevButton = card.querySelector(".prev-btn");
        const nextButton = card.querySelector(".next-btn");

        if (photos.length > 1) {
            nextButton.addEventListener("click", function () {
                currentImageIndex =
                    (currentImageIndex + 1) % photos.length;
                image.src = photos[currentImageIndex];
            });
            prevButton.addEventListener("click", function () {
                currentImageIndex =
                    (currentImageIndex - 1 + photos.length) % photos.length;
                image.src = photos[currentImageIndex];
            });
        }
        const packageButton = card.querySelector(".package-btn");
        packageButton.addEventListener("click", function () {
            alert("Travel packages for " + destination.name + " coming soon!");
        });
        container.appendChild(card);
    });
}
displayDestinations(destinations);
const searchInput = document.getElementById("searchInput");
const categoryButtons = document.querySelectorAll(".category-btn");
let selectedCategory = "All";

function filterDestinations() {
    const searchText = searchInput.value.toLowerCase();
    const filteredDestinations = destinations.filter(destination => {
        const matchesSearch =
            destination.name.toLowerCase().includes(searchText) ||
            destination.state.toLowerCase().includes(searchText);
        const matchesCategory =
            selectedCategory === "All" ||
            destination.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    displayDestinations(filteredDestinations);
}
categoryButtons.forEach(button => {
    button.addEventListener("click", function () {
        selectedCategory = this.dataset.category;
        categoryButtons.forEach(btn => {
            btn.classList.remove("active");
        });
        this.classList.add("active");
        filterDestinations();
    });
});
searchInput.addEventListener("input", filterDestinations);

