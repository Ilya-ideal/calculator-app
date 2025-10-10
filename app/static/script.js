async function calculate() {
    const num1 = document.getElementById('num1').value;
    const num2 = document.getElementById('num2').value;
    const operation = document.getElementById('operation').value;
    const resultDiv = document.getElementById('result');

    try {
        const response = await fetch('/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ num1, num2, operation })
        });

        const data = await response.json();

        if (response.ok) {
            resultDiv.textContent = `Result: ${data.result}`;
            resultDiv.style.color = 'green';
        } else {
            resultDiv.textContent = `Error: ${data.error}`;
            resultDiv.style.color = 'red';
        }
    } catch (error) {
        resultDiv.textContent = `Error: ${error.message}`;
        resultDiv.style.color = 'red';
    }
}