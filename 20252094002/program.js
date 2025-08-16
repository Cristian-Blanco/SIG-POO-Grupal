<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" href="estilos.css">
    <script src="program.js" defer></script>
</head>
<body>
    <ul>
        <li class="subrama">Subrama 1</li>
        <li class="subrama">Subrama 2</li>
        <li class="subrama">Subrama 3</li>
    </ul>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const subramas = document.querySelectorAll('li.subrama');
            subramas.forEach(function(item) {
                item.addEventListener('click', function() {
                    alert(`Has seleccionado: ${item.textContent}`);
                });
            });
        });
    </script>
</body>
</html>