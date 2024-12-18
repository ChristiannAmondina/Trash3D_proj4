import { h, render } from 'preact';
import './assets/styles.css';

function App() {
  // Typewriter text and sound setup
  const texts = [
    "Inside this trashcan, a world of chaos unfolds: dirty water, scattered trash, leftover food, and buzzing flies create an eerie atmosphere.",
    "This 3D scene is originally made and concepted by Christian A. Balasabas.",
    "The buzzing of the flies is constant, adding a layer of discomfort to the already unpleasant scene.",
    "The trash piles up, creating a mess that never seems to end. Will it ever be cleaned up?",
    "The water is stagnant, and the food remnants are a perfect breeding ground for pests.",
    "This 3D scene offers a glimpse into the world of decay and neglect, where cleanliness is a distant memory."
  ];

  let textIndex = 0;
  let typingIndex = 0;

  const sound = new Audio("./images/sound/Cave _2 _ Ambience _ Sound Effect(M4A_128K).m4a");

  function playSound() {
    sound.play();
  }

  function typeText(text, typewriter) {
    if (typingIndex < text.length) {
      typewriter.textContent += text[typingIndex];
      typingIndex++;
      setTimeout(() => typeText(text, typewriter), 50); // Adjust typing speed here
    } else {
      setTimeout(() => {
        typewriter.textContent = ''; // Clear text
        textIndex = (textIndex + 1) % texts.length; // Move to the next text
        typingIndex = 0; // Reset typing index
        setTimeout(() => {
          playSound(); // Play sound when starting next text
          typeText(texts[textIndex], typewriter); // Start typing next text
        }, 500); // Wait a bit before starting the next one
      }, 6000); // Text stays visible for 6 seconds
    }
  }

  return (
    <div>
      {/* Typewriter Text */}
      <div class="typewriter-container">
        <div
          class="typewriter-text"
          id="typewriter-text"
          ref={(el) => {
            if (el) {
              setTimeout(() => {
                playSound();
                typeText(texts[textIndex], el);
              }, 1000); // Delay before typing starts
            }
          }}
        />
      </div>

      {/* Project Title */}
      <div class="project-title">
        Trash Chronicles: A 3D Dive into Waste
      </div>

      {/* Image Gallery */}
      <div class="image-gallery">
        {[
          { src: '.images/HTML/Activity 4.1.png', title: '4.1 BURGER' },
          { src: '.images/HTML/Activity 4.2.png', title: '4.2 FLY' },
          { src: './images/HTML/Activity 4.4.png', title: '4.4 FLAG' },
          { src: './images/HTML/Activity 4.5.png', title: '4.5 SPEAKER' },
          { src: './images/HTML/Activity 4.6.png', title: '4.6 DIRTY WATER' },
          { src: './images/HTML/Activity 4.7.png', title: '4.7 22WATER DUST' }
        ].map((item, index) => (
          <div class="image-item" key={index}>
            <img src={item.src} alt={`Image ${index + 1}`} />
            <p class="image-title">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

render(<App />, document.getElementById('app'));
