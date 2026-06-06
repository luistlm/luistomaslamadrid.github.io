(function () {
    var exchangeRate = 1120;
    var categoryColors = {
        "Alimentos": "#22c55e",
        "Servicios": "#2563eb",
        "Entretenimiento": "#f97316",
        "Transporte": "#a855f7",
        "Musica/Suscripciones": "#ef4444",
        "Otros": "#64748b"
    };

    var incomes = [
        { source: "Sueldo ACME Corp", amount: 980000, recurrence: "Recurrente mensual", date: "06/03/2026" },
        { source: "Freelance audio", amount: 225000, recurrence: "Este mes unicamente", date: "05/29/2026" },
        { source: "Regalias digitales", amount: 35500, recurrence: "Recurrente mensual", date: "05/24/2026" }
    ];

    var expenses = [
        { description: "Supermercado Norte", category: "Alimentos", amount: 42500, date: "06/03/2026", icon: "🛒" },
        { description: "Luz y gas", category: "Servicios", amount: 31200, date: "06/02/2026", icon: "⚡" },
        { description: "Cine con amigos", category: "Entretenimiento", amount: 18000, date: "06/01/2026", icon: "🎬" },
        { description: "Subte y taxi", category: "Transporte", amount: 14600, date: "05/31/2026", icon: "🚕" },
        { description: "Spotify + software", category: "Musica/Suscripciones", amount: 26800, date: "05/30/2026", icon: "🎧" },
        { description: "Cafe Martinez", category: "Alimentos", amount: 5200, date: "05/30/2026", icon: "☕" }
    ];

    var icons = {
        "Alimentos": "🛒",
        "Servicios": "⚡",
        "Entretenimiento": "🎬",
        "Transporte": "🚕",
        "Musica/Suscripciones": "🎧",
        "Otros": "•"
    };

    function $(selector) {
        return document.querySelector(selector);
    }

    function $all(selector) {
        return Array.prototype.slice.call(document.querySelectorAll(selector));
    }

    function formatMoney(value, currency) {
        if (currency === "USD") {
            return "US$ " + new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value);
        }

        return "$ " + new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(value);
    }

    function today() {
        var now = new Date();
        return now.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric"
        });
    }

    function setTheme(theme) {
        var root = document.documentElement;
        var toggle = $("#themeToggle");
        var label = toggle ? toggle.querySelector(".theme-toggle__label") : null;
        var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        var resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

        root.setAttribute("data-theme", resolvedTheme);
        localStorage.setItem("freemoney-theme", theme);

        if (toggle) {
            toggle.setAttribute("aria-pressed", resolvedTheme === "dark" ? "true" : "false");
        }

        if (label) {
            label.textContent = theme === "system" ? "Modo sistema" : (resolvedTheme === "dark" ? "Modo oscuro" : "Modo claro");
        }
    }

    function initTheme() {
        var savedTheme = localStorage.getItem("freemoney-theme") || "system";
        var cycle = ["system", "light", "dark"];
        var toggle = $("#themeToggle");

        setTheme(savedTheme);

        if (toggle) {
            toggle.addEventListener("click", function () {
                var current = localStorage.getItem("freemoney-theme") || "system";
                var next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
                setTheme(next);
            });
        }

        if (window.matchMedia) {
            window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
                if ((localStorage.getItem("freemoney-theme") || "system") === "system") {
                    setTheme("system");
                }
            });
        }
    }

    function initTabs() {
        $all("[data-tab]").forEach(function (button) {
            button.addEventListener("click", function () {
                var tab = button.getAttribute("data-tab");

                $all("[data-tab]").forEach(function (item) {
                    item.classList.toggle("active", item === button);
                });

                $all("[data-tab-panel]").forEach(function (panel) {
                    panel.classList.toggle("active", panel.getAttribute("data-tab-panel") === tab);
                });
            });
        });
    }

    function totalsByCategory() {
        return expenses.reduce(function (acc, expense) {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {});
    }

    function updateSummaries() {
        var totalIncome = incomes.reduce(function (sum, income) { return sum + income.amount; }, 0);
        var totalSpending = expenses.reduce(function (sum, expense) { return sum + expense.amount; }, 0);

        $("#mainIncome").textContent = formatMoney(totalIncome);
        $("#mainSpending").textContent = formatMoney(totalSpending);
    }

    function describeCategory(category, amount, total) {
        var percent = total ? Math.round((amount / total) * 100) : 0;
        $("#chartDetail").textContent = category + ": " + formatMoney(amount) + " (" + percent + "%)";
    }

    function renderPieChart() {
        var chart = $("#pieChart");
        var legend = $("#chartLegend");
        var totals = totalsByCategory();
        var total = Object.keys(totals).reduce(function (sum, category) { return sum + totals[category]; }, 0);
        var offset = 0;

        chart.innerHTML = "";
        legend.innerHTML = "";

        Object.keys(totals).forEach(function (category) {
            var amount = totals[category];
            var percent = total ? (amount / total) * 100 : 0;
            var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            var color = categoryColors[category] || categoryColors.Otros;

            circle.setAttribute("class", "pie-slice");
            circle.setAttribute("cx", "21");
            circle.setAttribute("cy", "21");
            circle.setAttribute("r", "15.9155");
            circle.setAttribute("stroke", color);
            circle.setAttribute("stroke-dasharray", percent + " " + (100 - percent));
            circle.setAttribute("stroke-dashoffset", 100 - offset);
            circle.setAttribute("tabindex", "0");
            circle.setAttribute("role", "button");
            circle.setAttribute("aria-label", category + " " + Math.round(percent) + "%");
            circle.addEventListener("click", function () {
                describeCategory(category, amount, total);
            });
            circle.addEventListener("keyup", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    describeCategory(category, amount, total);
                }
            });

            chart.appendChild(circle);
            offset += percent;

            var legendButton = document.createElement("button");
            legendButton.type = "button";
            legendButton.innerHTML = "<span><i style=\"background:" + color + "\"></i>" + category + "</span><strong>" + formatMoney(amount) + "</strong>";
            legendButton.addEventListener("click", function () {
                describeCategory(category, amount, total);
            });
            legend.appendChild(legendButton);
        });
    }

    function renderIncomeList() {
        var list = $("#incomeList");
        list.innerHTML = "";

        incomes.forEach(function (income) {
            var item = document.createElement("article");
            item.className = "transaction-item";
            item.innerHTML = [
                "<span class=\"transaction-icon\">↗</span>",
                "<span><strong class=\"transaction-title\">" + income.source + "</strong>",
                "<small class=\"transaction-meta\">" + income.date + " · " + income.recurrence + "</small></span>",
                "<strong class=\"transaction-amount positive\">" + formatMoney(income.amount) + "</strong>"
            ].join("");
            list.appendChild(item);
        });
    }

    function renderExpenseList() {
        var list = $("#expenseList");
        list.innerHTML = "";

        expenses.forEach(function (expense) {
            var item = document.createElement("article");
            item.className = "transaction-item";
            item.innerHTML = [
                "<span class=\"transaction-icon\">" + (expense.icon || icons[expense.category] || icons.Otros) + "</span>",
                "<span><strong class=\"transaction-title\">" + expense.description + "</strong>",
                "<small class=\"transaction-meta\">" + expense.date + " · " + expense.category + "</small></span>",
                "<strong class=\"transaction-amount negative\">-" + formatMoney(expense.displayAmount || expense.amount, expense.displayCurrency) + "</strong>"
            ].join("");
            list.appendChild(item);
        });
    }

    function renderAll() {
        updateSummaries();
        renderPieChart();
        renderIncomeList();
        renderExpenseList();
    }

    function addExpense(expense) {
        expenses.unshift(expense);
        renderAll();
    }

    function inferCategory(text) {
        var normalized = text.toLowerCase();

        if (/cafe|café|super|mercado|cena|almuerzo|restaurant|comida|food|coffee/.test(normalized)) {
            return "Alimentos";
        }

        if (/luz|gas|agua|internet|telefono|servicio|utility|bill/.test(normalized)) {
            return "Servicios";
        }

        if (/cine|bar|amigos|juego|movie|game|show|teatro/.test(normalized)) {
            return "Entretenimiento";
        }

        if (/taxi|uber|subte|tren|bus|nafta|transport|fuel/.test(normalized)) {
            return "Transporte";
        }

        if (/spotify|netflix|suscrip|subscription|software|musica|music|saas/.test(normalized)) {
            return "Musica/Suscripciones";
        }

        return "Otros";
    }

    function parseBotMessage(message) {
        var amountMatch = message.match(/(?:us\$|usd)?\s*([0-9]+(?:[.,][0-9]+)?)(?:\s*(usd|usdc|ars))?/i);

        if (!amountMatch) {
            return null;
        }

        var numericValue = Number(amountMatch[1].replace(",", "."));
        var currency = (amountMatch[2] || (/usd|us\$|usdc/i.test(message) ? "USD" : "ARS")).toUpperCase();
        var description = message.replace(amountMatch[0], "").trim() || "Gasto por WhatsApp";
        var category = inferCategory(description);
        var amountInArs = currency === "USD" || currency === "USDC" ? numericValue * exchangeRate : numericValue;

        return {
            description: description,
            category: category,
            amount: Math.round(amountInArs),
            displayAmount: numericValue,
            displayCurrency: currency === "USD" || currency === "USDC" ? "USD" : undefined,
            date: today(),
            icon: icons[category] || icons.Otros
        };
    }

    function initForms() {
        $("#incomeForm").addEventListener("submit", function (event) {
            event.preventDefault();
            incomes.unshift({
                source: $("#incomeSource").value,
                amount: Number($("#incomeAmount").value),
                recurrence: $("#incomeRecurrence").value,
                date: today()
            });
            event.target.reset();
            renderAll();
        });

        $("#expenseForm").addEventListener("submit", function (event) {
            event.preventDefault();
            var category = $("#expenseCategory").value;
            addExpense({
                description: $("#expenseDescription").value || "Gasto manual",
                category: category,
                amount: Number($("#expenseAmount").value),
                date: today(),
                icon: icons[category] || icons.Otros
            });
            event.target.reset();
        });

        $("#botForm").addEventListener("submit", function (event) {
            event.preventDefault();
            var message = $("#botMessage").value;
            var parsed = parseBotMessage(message);

            if (!parsed) {
                $("#botResponse").textContent = "No pude encontrar un monto. Proba con mensajes como \"1500 cafe\" o \"Subscription 15 usd\".";
                return;
            }

            addExpense(parsed);
            $("#botResponse").textContent = "Registrado: " + parsed.description + " · " + parsed.category + " · " + formatMoney(parsed.displayAmount || parsed.amount, parsed.displayCurrency);
            event.target.reset();
        });
    }

    function parseStatementLine(line) {
        var dateMatch = line.match(/(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2})/);
        var amountMatch = line.match(/([+-]?\s*(?:\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d{2})?)\s*(?:ars|usd|usdc)?\s*$/i);

        if (!dateMatch || !amountMatch) {
            return null;
        }

        var amountText = amountMatch[1].replace(/\s/g, "");
        var decimalNormalized = amountText.indexOf(",") > -1 && amountText.indexOf(".") > -1
            ? amountText.replace(/\./g, "").replace(",", ".")
            : amountText.replace(",", ".");
        var amount = Number(decimalNormalized);
        var description = line
            .replace(dateMatch[0], "")
            .replace(amountMatch[0], "")
            .replace(/\b(debit|credit|debito|credito|débito|crédito)\b/ig, "")
            .trim();
        var isIncome = amount > 0 || /salary|sueldo|transferencia recibida|deposit|deposito|ingreso|credit|credito|crédito/i.test(line);

        return {
            date: dateMatch[0],
            description: description || "Movimiento detectado",
            type: isIncome ? "Ingreso/Credito" : "Gasto/Debito",
            amount: Math.abs(amount)
        };
    }

    function renderParserResults(results) {
        var tbody = $("#parserResults");
        tbody.innerHTML = "";

        results.forEach(function (transaction) {
            var row = document.createElement("tr");
            row.innerHTML = [
                "<td>" + transaction.date + "</td>",
                "<td>" + transaction.description + "</td>",
                "<td>" + transaction.type + "</td>",
                "<td>" + formatMoney(transaction.amount) + "</td>"
            ].join("");
            tbody.appendChild(row);
        });

        $("#parserCount").textContent = results.length + (results.length === 1 ? " item" : " items");
    }

    function initParser() {
        var form = $("#parserForm");

        function process() {
            var text = $("#statementText").value;
            var results = text
                .split(/\n+/)
                .map(function (line) { return parseStatementLine(line.trim()); })
                .filter(Boolean);

            renderParserResults(results);
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            process();
        });

        process();
    }

    function initClock() {
        var clock = $("#prototypeClock");
        var now = new Date();
        clock.textContent = now.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        initTheme();
        initTabs();
        initForms();
        initParser();
        initClock();
        renderAll();
    });
})();
