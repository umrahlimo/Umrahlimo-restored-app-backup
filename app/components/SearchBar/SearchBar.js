'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { fetchRoutes } from '../../../lib/firebase'
import './SearchBar.css'

const SearchBar = ({ onSearch }) => {
  const router = useRouter()
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  
  // Custom routes
  const [availableRoutes, setAvailableRoutes] = useState([])
  const [uniqueLocations, setUniqueLocations] = useState([])
  
  // Suggestions UI
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  const [showToSuggestions, setShowToSuggestions] = useState(false)
  
  const fromWrapperRef = useRef(null)
  const toWrapperRef = useRef(null)

  // Load predefined routes
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const routes = await fetchRoutes()
        setAvailableRoutes(routes || [])
        
        // Extract unique locations from fromLabel and toLabel
        const locations = new Set()
        routes.forEach(route => {
          if (route.fromLabel) locations.add(route.fromLabel)
          if (route.toLabel) locations.add(route.toLabel)
          if (route.fromPlaceholder) locations.add(route.fromPlaceholder)
          if (route.toPlaceholder) locations.add(route.toPlaceholder)
        })
        
        setUniqueLocations(Array.from(locations).filter(Boolean).sort())
      } catch (error) {
        console.error('Error fetching routes:', error)
      }
    }
    loadRoutes()
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fromWrapperRef.current && !fromWrapperRef.current.contains(event.target)) {
        setShowFromSuggestions(false)
      }
      if (toWrapperRef.current && !toWrapperRef.current.contains(event.target)) {
        setShowToSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = () => {
    if (fromLocation && toLocation) {
      setIsSearching(true)
      if (onSearch) {
        onSearch({ from: fromLocation, to: toLocation })
      }
      router.push(`/search?from=${encodeURIComponent(fromLocation)}&to=${encodeURIComponent(toLocation)}`)
    } else {
      alert('Please select both pickup and drop-off locations')
    }
  }

  const handleSwapLocations = () => {
    const temp = fromLocation
    setFromLocation(toLocation)
    setToLocation(temp)
  }

  const filterSuggestions = (query) => {
    if (!query) return uniqueLocations
    const lowerQuery = query.toLowerCase()
    return uniqueLocations.filter(loc => loc.toLowerCase().includes(lowerQuery))
  }

  const fromSuggestionsList = filterSuggestions(fromLocation)
  const toSuggestionsList = filterSuggestions(toLocation)

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        {/* From Location */}
        <div className="search-field from-field" ref={fromWrapperRef}>
          <div className="field-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2C12.5523 2 13 2.44772 13 3V5.08296C16.0628 5.55904 18.441 7.93721 18.917 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H18.917C18.441 16.0628 16.0628 18.441 13 18.917V21C13 21.5523 12.5523 22 12 22C11.4477 22 11 21.5523 11 21V18.917C7.93721 18.441 5.55904 16.0628 5.08296 13H3C2.44772 13 2 12.5523 2 12C2 11.4477 2.44772 11 3 11H5.08296C5.55904 7.93721 7.93721 5.55904 11 5.08296V3C11 2.44772 11.4477 2 12 2ZM12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7Z" />
            </svg>
          </div>
          <div className="field-content">
            <label>From</label>
            <input
              type="text"
              placeholder="Select pickup location"
              value={fromLocation}
              onChange={(e) => {
                setFromLocation(e.target.value)
                setShowFromSuggestions(true)
              }}
              onFocus={() => setShowFromSuggestions(true)}
              autoComplete="off"
            />
            
            {showFromSuggestions && fromSuggestionsList.length > 0 && (
              <ul className="route-suggestions">
                {fromSuggestionsList.map((loc, i) => (
                  <li 
                    key={i} 
                    onClick={() => {
                      setFromLocation(loc)
                      setShowFromSuggestions(false)
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    {loc}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Divider with Swap Button */}
        <div className="field-divider">
          <button
            type="button"
            className="swap-button"
            onClick={handleSwapLocations}
            title="Swap locations"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" />
            </svg>
          </button>
        </div>

        {/* To Location */}
        <div className="search-field to-field" ref={toWrapperRef}>
          <div className="field-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div className="field-content">
            <label>To</label>
            <input
              type="text"
              placeholder="Select drop-off location"
              value={toLocation}
              onChange={(e) => {
                setToLocation(e.target.value)
                setShowToSuggestions(true)
              }}
              onFocus={() => setShowToSuggestions(true)}
              autoComplete="off"
            />
            
            {showToSuggestions && toSuggestionsList.length > 0 && (
              <ul className="route-suggestions">
                {toSuggestionsList.map((loc, i) => (
                  <li 
                    key={i} 
                    onClick={() => {
                      setToLocation(loc)
                      setShowToSuggestions(false)
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    {loc}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Search Button */}
        <button
          type="button"
          className={`search-button ${isSearching ? 'loading' : ''}`}
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <>
              <span className="button-spinner"></span>
              Searching...
            </>
          ) : (
            'Search'
          )}
        </button>
      </div>
    </div>
  )
}

export default SearchBar

