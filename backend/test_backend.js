async function testBackend() {
    try {
        console.log('Testing connectivity to http://localhost:3000...');

        // Test Register
        const regRes = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'TestUser',
                email: 'test@user.com',
                password: 'password123',
                role: 'student'
            })
        });

        if (regRes.ok) {
            const data = await regRes.json();
            console.log('✅ Registration Successful:', data);
        } else {
            const err = await regRes.text();
            console.error('❌ Registration Failed:', regRes.status, err);
        }

        // Test Login
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@user.com',
                password: 'password123'
            })
        });

        if (loginRes.ok) {
            const data = await loginRes.json();
            console.log('✅ Login Successful:', data);
        } else {
            const err = await loginRes.text();
            console.error('❌ Login Failed:', loginRes.status, err);
        }

    } catch (error) {
        console.error('❌ Network/Server Error:', error.message);
    }
}

testBackend();
