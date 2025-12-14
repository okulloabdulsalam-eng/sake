/**
 * Console-based Account Storage Test
 * 
 * Run this in browser console to test account storage functionality
 * 
 * Usage:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire file
 * 3. Run: testAccountStorage()
 */

function testAccountStorage() {
    console.log('🔍 Starting Account Storage Test...\n');
    const results = {
        passed: [],
        failed: [],
        warnings: []
    };
    
    // Test 1: localStorage Availability
    console.log('Test 1: localStorage Availability');
    try {
        if (typeof Storage === 'undefined') {
            results.failed.push('localStorage not supported');
            console.error('❌ localStorage is not supported');
        } else {
            results.passed.push('localStorage is supported');
            console.log('✅ localStorage is supported');
        }
    } catch (error) {
        results.failed.push('localStorage check failed: ' + error.message);
        console.error('❌ Error:', error);
    }
    
    // Test 2: Write/Read Test
    console.log('\nTest 2: Write/Read Test');
    try {
        const testData = { test: 'value', timestamp: Date.now() };
        localStorage.setItem('__test_storage__', JSON.stringify(testData));
        const readData = JSON.parse(localStorage.getItem('__test_storage__'));
        
        if (readData && readData.test === 'value') {
            results.passed.push('Write/Read test passed');
            console.log('✅ Write/Read test passed');
        } else {
            results.failed.push('Write/Read test failed');
            console.error('❌ Write/Read test failed');
        }
        localStorage.removeItem('__test_storage__');
    } catch (error) {
        results.failed.push('Write/Read test error: ' + error.message);
        console.error('❌ Error:', error);
    }
    
    // Test 3: userData Storage
    console.log('\nTest 3: userData Storage');
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            const parsed = JSON.parse(userData);
            console.log('✅ userData found:', parsed);
            
            // Check required fields
            const requiredFields = ['email', 'uid'];
            const missingFields = requiredFields.filter(field => !parsed[field]);
            
            if (missingFields.length === 0) {
                results.passed.push('userData has all required fields');
                console.log('✅ userData has all required fields');
            } else {
                results.warnings.push('userData missing fields: ' + missingFields.join(', '));
                console.warn('⚠️ Missing fields:', missingFields);
            }
        } else {
            results.warnings.push('No userData (user not logged in)');
            console.log('ℹ️ No userData (user not logged in)');
        }
    } catch (error) {
        results.failed.push('userData test error: ' + error.message);
        console.error('❌ Error:', error);
    }
    
    // Test 4: users Array Storage
    console.log('\nTest 4: users Array Storage');
    try {
        const users = localStorage.getItem('users');
        if (users) {
            const parsed = JSON.parse(users);
            if (Array.isArray(parsed)) {
                results.passed.push(`users array found: ${parsed.length} users`);
                console.log(`✅ users array found: ${parsed.length} users`);
            } else {
                results.warnings.push('users is not an array');
                console.warn('⚠️ users is not an array');
            }
        } else {
            results.warnings.push('No users array');
            console.log('ℹ️ No users array');
        }
    } catch (error) {
        results.failed.push('users array test error: ' + error.message);
        console.error('❌ Error:', error);
    }
    
    // Test 5: Firebase Auth Check
    console.log('\nTest 5: Firebase Auth Check');
    try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const auth = firebase.auth();
            const currentUser = auth.currentUser;
            
            if (currentUser) {
                results.passed.push('Firebase user authenticated: ' + currentUser.email);
                console.log('✅ Firebase user authenticated:', currentUser.email);
                console.log('   UID:', currentUser.uid);
                console.log('   Display Name:', currentUser.displayName || 'Not set');
            } else {
                results.warnings.push('No Firebase user authenticated');
                console.log('ℹ️ No Firebase user authenticated');
            }
        } else {
            results.warnings.push('Firebase Auth not available');
            console.log('ℹ️ Firebase Auth not available');
        }
    } catch (error) {
        results.failed.push('Firebase Auth test error: ' + error.message);
        console.error('❌ Error:', error);
    }
    
    // Test 6: getCurrentUser Function
    console.log('\nTest 6: getCurrentUser Function');
    try {
        if (typeof getCurrentUser === 'function') {
            const user = getCurrentUser();
            if (user) {
                results.passed.push('getCurrentUser() returned user');
                console.log('✅ getCurrentUser() returned user:', user.email);
            } else {
                results.warnings.push('getCurrentUser() returned null');
                console.log('ℹ️ getCurrentUser() returned null');
            }
        } else {
            results.warnings.push('getCurrentUser() function not available');
            console.log('ℹ️ getCurrentUser() function not available');
        }
    } catch (error) {
        results.failed.push('getCurrentUser test error: ' + error.message);
        console.error('❌ Error:', error);
    }
    
    // Test 7: loadUserData Function
    console.log('\nTest 7: loadUserData Function');
    try {
        if (typeof loadUserData === 'function') {
            const result = loadUserData();
            if (result) {
                results.passed.push('loadUserData() returned true');
                console.log('✅ loadUserData() returned true');
            } else {
                results.warnings.push('loadUserData() returned false (no userData)');
                console.log('ℹ️ loadUserData() returned false (no userData)');
            }
        } else {
            results.warnings.push('loadUserData() function not available');
            console.log('ℹ️ loadUserData() function not available');
        }
    } catch (error) {
        results.failed.push('loadUserData test error: ' + error.message);
        console.error('❌ Error:', error);
    }
    
    // Test 8: Navigation Update Functions
    console.log('\nTest 8: Navigation Update Functions');
    try {
        if (typeof updateNavigationLinks === 'function' || typeof window.updateNavigationLinks === 'function') {
            results.passed.push('updateNavigationLinks() function available');
            console.log('✅ updateNavigationLinks() function available');
        } else {
            results.warnings.push('updateNavigationLinks() function not available');
            console.log('ℹ️ updateNavigationLinks() function not available');
        }
        
        if (typeof checkIfLoggedIn === 'function' || typeof window.checkIfLoggedIn === 'function') {
            const isLoggedIn = (typeof checkIfLoggedIn === 'function') ? checkIfLoggedIn() : window.checkIfLoggedIn();
            results.passed.push(`checkIfLoggedIn() returned: ${isLoggedIn}`);
            console.log(`✅ checkIfLoggedIn() returned: ${isLoggedIn}`);
        } else {
            results.warnings.push('checkIfLoggedIn() function not available');
            console.log('ℹ️ checkIfLoggedIn() function not available');
        }
    } catch (error) {
        results.failed.push('Navigation test error: ' + error.message);
        console.error('❌ Error:', error);
    }
    
    // Test 9: Data Persistence
    console.log('\nTest 9: Data Persistence');
    try {
        const testData = {
            name: 'Persistence Test',
            email: 'test@example.com',
            uid: 'test-' + Date.now()
        };
        localStorage.setItem('__persistence_test__', JSON.stringify(testData));
        const reloaded = JSON.parse(localStorage.getItem('__persistence_test__'));
        
        if (reloaded && reloaded.email === testData.email) {
            results.passed.push('Data persistence test passed');
            console.log('✅ Data persistence test passed');
        } else {
            results.failed.push('Data persistence test failed');
            console.error('❌ Data persistence test failed');
        }
        localStorage.removeItem('__persistence_test__');
    } catch (error) {
        results.failed.push('Persistence test error: ' + error.message);
        console.error('❌ Error:', error);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    console.log('\n');
    
    if (results.passed.length > 0) {
        console.log('✅ Passed Tests:');
        results.passed.forEach(test => console.log('   - ' + test));
    }
    
    if (results.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        results.warnings.forEach(warning => console.log('   - ' + warning));
    }
    
    if (results.failed.length > 0) {
        console.log('\n❌ Failed Tests:');
        results.failed.forEach(failure => console.log('   - ' + failure));
    }
    
    console.log('\n' + '='.repeat(50));
    
    // Overall status
    if (results.failed.length === 0) {
        console.log('✅ ALL CRITICAL TESTS PASSED');
        if (results.warnings.length > 0) {
            console.log('⚠️  Some optional features are not available (this is OK)');
        }
    } else {
        console.log('❌ SOME TESTS FAILED - Please review errors above');
    }
    
    return results;
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
    console.log('📋 Account Storage Test Script Loaded');
    console.log('Run: testAccountStorage()');
}

