from typing import Dict, Optional

PLANET_SIGN_INTERPRETATIONS: Dict[str, Dict[str, str]] = {
    "Sun": {
        "Aries": "Exalted position. Represents high leadership, intense vitality, self-confidence, and a strong drive to excel.",
        "Taurus": "Brings patience, steady ambition, focus on material security, and appreciation for beauty and comfort.",
        "Gemini": "Indicates intellectuality, adaptability, versatile communication style, and high curiosity.",
        "Cancer": "Brings deep emotional focus, protective instinct, strong attachment to family/home, and intuitive leadership.",
        "Leo": "Own sign. Indicates magnanimity, high self-esteem, creativity, dramatic self-expression, and natural authority.",
        "Virgo": "Emphasizes analytical skills, meticulousness, service orientation, practical logic, and health consciousness.",
        "Libra": "Debilitated position. Requires finding balance, learning cooperation, compromising self-will, and focusing on partnerships.",
        "Scorpio": "Brings intense willpower, emotional depth, interest in hidden or mystical knowledge, and transformative power.",
        "Sagittarius": "Fosters optimistic outlook, philosophical bent of mind, love for freedom, teaching abilities, and broad vision.",
        "Capricorn": "Indicates disciplined ambition, structured approach, professional focus, perseverance, and strong sense of duty.",
        "Aquarius": "Focuses on humanitarian ideals, social networks, innovative thinking, independence, and group work.",
        "Pisces": "Brings spiritual inclinations, deep empathy, artistic imagination, and a dreamy or introspective personality."
    },
    "Moon": {
        "Aries": "Triggers impulsive emotions, passionate responses, a pioneering spirit, and active emotional drive.",
        "Taurus": "Exalted position. Brings emotional stability, high contentment, steady desires, and a deep appreciation for nature and stability.",
        "Gemini": "Indicates quick, intellectualized feelings, chatty emotional expression, and a multi-tasking mind.",
        "Cancer": "Own sign. Deeply intuitive, maternal, highly receptive, sentimental, and strongly attached to domestic peace.",
        "Leo": "Seeks public recognition, emotional pride, dramatic emotional expressions, and generous feelings.",
        "Virgo": "Inclined towards worrying, emotional need for order, practical helpfulness, and self-improvement.",
        "Libra": "Seeks harmonious relationships, hates conflict, values diplomacy, and feels balanced when in partnership.",
        "Scorpio": "Debilitated position. Deep emotional intensity, potential for jealousy, highly intuitive, private, and emotionally transformative.",
        "Sagittarius": "Brings a joyful, adventurous emotional state, seeking truth, optimism, and philosophical light-heartedness.",
        "Capricorn": "Keeps feelings reserved, highly structured, emotional self-control, and focused on duty and achievement.",
        "Aquarius": "Indicates emotional independence, detachment, humanitarian empathy, and unconventional reactions.",
        "Pisces": "Extremely sensitive, highly psychic, compassionate, easily influenced by surroundings, and artistic."
    },
    "Mars": {
        "Aries": "Own sign. Pure, raw energy. High courage, pioneering drive, direct action, and competitive spirit.",
        "Taurus": "Steady, persistent action. Slow to anger but highly stubborn once set on a goal.",
        "Gemini": "Active verbal energy, quick debates, restless drive, and skill with hands or speech.",
        "Cancer": "Debilitated. Emotional action, indirect drive, energy directed towards protection of loved ones, passive-aggressive.",
        "Leo": "Noble energy, high pride in action, dramatic courage, and expressive power.",
        "Virgo": "Meticulous work, energy directed to detail, critical capacity, and craftsmanship.",
        "Libra": "Diplomatic action, seeks cooperation, can struggle with indecision when pursuing desires.",
        "Scorpio": "Own sign. Quiet power, strategic stamina, intense sexual and transformative energy.",
        "Sagittarius": "Energetically pursues higher ideals, righteous actions, and loves freedom and travel.",
        "Capricorn": "Exalted. Structured ambition, immense focus, executive power, and highly disciplined stamina.",
        "Aquarius": "Fights for progressive causes, team coordination, independent action.",
        "Pisces": "Indirect drive, flow of energy guided by emotions, creative expression, non-confrontational."
    }
}

PLANET_HOUSE_INTERPRETATIONS: Dict[str, Dict[int, str]] = {
    "Sun": {
        1: "Sun in the 1st House: Strong vitality, high self-reliance, leadership aura, and ego-driven focus on physical identity.",
        2: "Sun in the 2nd House: Focuses energy on building wealth, values personal resources, and values financial stability.",
        3: "Sun in the 3rd House: Expressive intellect, active communication with siblings, mental curiosity, and short travels.",
        4: "Sun in the 4th House: Strong focus on home life, ancestral roots, domestic security, and self-discovery in private spaces.",
        5: "Sun in the 5th House: High creativity, love for romance, children, self-expression, and sports or speculation.",
        6: "Sun in the 6th House: Service-oriented, handles obstacles efficiently, focuses on health, daily routines, and self-discipline.",
        7: "Sun in the 7th House: Primary focus on relationships, partnerships, marriage, and public interactions.",
        8: "Sun in the 8th House: Attracted to occult knowledge, deep transformations, shared resources, and psychological depths.",
        9: "Sun in the 9th House: Philosophic mind, attraction to foreign travel, higher education, and moral righteousness.",
        10: "Sun in the 10th House: Career pinnacle, strong professional drive, public recognition, authority, and status.",
        11: "Sun in the 11th House: Focus on friendships, community networks, humanitarian causes, and fulfilling core desires.",
        12: "Sun in the 12th House: Attracted to solitude, spiritual liberation (Moksha), service behind the scenes, and deep introspection."
    },
    "Moon": {
        1: "Moon in the 1st House: Highly sensitive personality, fluctuating moods, strong intuitive impression on others.",
        2: "Moon in the 2nd House: Financial fluctuations, emotional connection to money and security, sweet voice.",
        3: "Moon in the 3rd House: Intuitive communicator, active imagination, close emotional ties to siblings.",
        4: "Moon in the 4th House: Deep need for home security, strong emotional bond with mother, seeking comfort.",
        5: "Moon in the 5th House: Artistic temperament, playful romance, highly protective of children, creative fluctuations.",
        6: "Moon in the 6th House: Emotional sensitive to health, service minded, feels emotional satisfaction through helping others.",
        7: "Moon in the 7th House: Needs emotional fulfillment in partnership, seeks security through marriage, popular in public.",
        8: "Moon in the 8th House: Highly psychic, intense emotional shifts, interested in esoteric and deep psychological truths.",
        9: "Moon in the 9th House: Philosophical outlook, travel brings emotional comfort, strong faith and spiritual seeking.",
        10: "Moon in the 10th House: Public career, works with the public, emotional connection to reputation, career shifts.",
        11: "Moon in the 11th House: Large circle of female friends, emotional fulfillment in social causes, hopes and wishes fluctuate.",
        12: "Moon in the 12th House: Subconscious emotional processing, highly empathetic, needs isolation to recharge, vivid dreams."
    }
}

def get_placement_interpretation(planet: str, sign: str, house: int) -> str:
    """
    Returns matching astrological readings based on computed coordinates.
    Provides standard professional interpretations as ground truth.
    """
    sign_interp = PLANET_SIGN_INTERPRETATIONS.get(planet, {}).get(sign, "")
    house_interp = PLANET_HOUSE_INTERPRETATIONS.get(planet, {}).get(house, "")
    
    parts = []
    if sign_interp:
        parts.append(f"{planet} in {sign}: {sign_interp}")
    if house_interp:
        parts.append(house_interp)
        
    if not parts:
        return f"{planet} in {sign} in the {house} House: Indicates planetary influence aligning your identity with your environment."
        
    return "\n".join(parts)

def lookup_astrology_kb(query: str) -> str:
    """
    Simple keyword search inside the localized interpretations catalog to support general Q&A RAG queries.
    """
    query_lower = query.lower()
    matches = []
    
    # Check planetary sign matches
    for planet, signs in PLANET_SIGN_INTERPRETATIONS.items():
        if planet.lower() in query_lower:
            for sign, text in signs.items():
                if sign.lower() in query_lower:
                    matches.append(f"**{planet} in {sign}**: {text}")
                    
    # Check planetary house matches
    for planet, houses in PLANET_HOUSE_INTERPRETATIONS.items():
        if planet.lower() in query_lower:
            for house, text in houses.items():
                house_words = [f"{house}th", f"{house}st", f"{house}nd", f"{house}rd", f"house {house}"]
                if any(w in query_lower for w in house_words) or (f" {house} " in query_lower):
                    matches.append(text)
                    
    if not matches:
        return (
            "Vedic & Classical Astrology Principle: The planetary placements in the signs show "
            "the energetic blueprint of the soul, while their placements in the houses reveal "
            "the physical arenas of life where these energies manifest."
        )
        
    return "\n\n".join(matches[:3])
