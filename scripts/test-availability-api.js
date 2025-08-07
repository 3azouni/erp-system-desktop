async function testAvailabilityAPI() {
  console.log('\n=== Testing Availability API ===\n')

  try {
    // Test the availability API endpoint
    const response = await fetch('http://localhost:3000/api/products/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: '9', // Cup Holder product ID
        quantity: 5
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const availability = await response.json()
    console.log('✅ Availability API Response:')
    console.log(JSON.stringify(availability, null, 2))

    // Test with a larger quantity
    const response2 = await fetch('http://localhost:3000/api/products/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: '9', // Cup Holder product ID
        quantity: 20
      })
    })

    if (!response2.ok) {
      throw new Error(`HTTP error! status: ${response2.status}`)
    }

    const availability2 = await response2.json()
    console.log('\n✅ Availability API Response (larger quantity):')
    console.log(JSON.stringify(availability2, null, 2))

    console.log('\n=== Test completed successfully! ===')
    console.log('The availability API is working correctly.')
    console.log('The frontend should now show stock availability in the order form.')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('Make sure the development server is running (npm run dev)')
  }
}

// Wait a bit for the server to start
setTimeout(testAvailabilityAPI, 3000)
