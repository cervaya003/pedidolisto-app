import FeaturedSection from "./FeaturedSection.js";
import HeroSection from "./HeroSection.js";
import MenuSection from "./MenuSection.js";
import StepsSection from "./StepsSection.js";

/** Registro tipo → componente. Un tipo nuevo también debe existir en el catálogo del API. */
export const SECTION_COMPONENTS = {
  hero: HeroSection,
  featured: FeaturedSection,
  menu: MenuSection,
  steps: StepsSection,
};
