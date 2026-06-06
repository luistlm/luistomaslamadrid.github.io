(function () {
    var storageKey = "freemoney-demo-state-v2";
    var exchangeRate = 1120;
    var retentionRate = 0.15;
    var categoryColors = {
        "Alimentos": "#22c55e",
        "Servicios": "#2563eb",
        "Entretenimiento": "#f97316",
        "Transporte": "#a855f7",
        "Musica/Suscripciones": "#ef4444",
        "Otros": "#64748b"
    };
    var icons = {
        "Alimentos": "🛒",
        "Servicios": "⚡",
        "Entretenimiento": "🎬",
        "Transporte": "🚕",
        "Musica/Suscripciones": "🎧",
        "Otros": "•"
    };
    var state = loadState();

    function defaultState() {
        return {
            incomes: [
                { source: "Sueldo ACME Corp", amount: 980000, recurrence: "Recurrent - monthly", date: "06/03/2026", origin: "statement" },
                { source: "Freelance audio", amount: 225000, recurrence: "This month only", date: "05/29/2026", origin: "manual" },
                { source: "Regalias digitales", amount: 35500, recurrence: "Recurrent - monthly", date: "05/24/2026", origin: "statement" }
            ],
            expenses: [
                { description: "Supermercado Norte", category: "Alimentos", amount: 42500, date: "06/03/2026", icon: "🛒", origin: "statement" },
                { description: "Luz y gas", category: "Servicios", amount: 31200, date: "06/02/2026", icon: "⚡", origin: "statement" },
                { description: "Cine con amigos", category: "Entretenimiento", amount: 18000, date: "06/01/2026", icon: "🎬", origin: "manual" },
                { description: "Subte y taxi", category: "Transporte", amount: 14600, date: "05/31/2026", icon: "🚕", origin: "statement" },
                { description: "Spotify + software", category: "Musica/Suscripciones", amount: 26800, date: "05/30/2026", icon: "🎧", origin: "whatsapp" },
                { description: "Cafe Martinez", category: "Alimentos", amount: 5200, date: "05/30/2026", icon: "☕", origin: "whatsapp" }
            ],
            goals: [
                { name: "Fondo de Emergencia", target: 2000000, current: 1340000, currency: "ARS", deadline: "2026-12-31", isDefault: true },
                { name: "Vacaciones", target: 1500, current: 900, currency: "USD", deadline: "2026-09-20", isDefault: false },
                { name: "Hardware / Nuevos Instrumentos", target: 2000, current: 750, currency: "USDC", deadline: "", isDefault: false }
            ],
            wallet: { ARS: 1420000, USD: 3750, USDC: 2250 },
            savingsHistory: [940000, 1100000, 1260000, 1460000, 1590000, 1840000, 2170000],
            lastRoundUp: 0,
            lastRetention: 0,
            statementCandidates: []
        };
    }

    function loadState() {
        try {
            var saved = JSON.parse(localStorage.getItem(storageKey));
            if (saved && Array.isArray(saved.incomes) && Array.isArray(saved.expenses) && Array.isArray(saved.goals)) {
                return Object.assign(defaultState(), saved);
            }
        } catch (error) {
            localStorage.removeItem(storageKey);
        }

        return defaultState();
    }

    function saveState() {
        localStorage.setItem(storageKey, JSON.stringify(state));
    }

    function $(selector) {
        return document.querySelector(selector);
    }

    function $all(selector) {
        return Array.prototype.slice.call(document.querySelectorAll(selector));
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;",
                "'": "&#039;"
            }[character];
        });
    }

    function formatMoney(value, currency) {
        var amount = Number(value) || 0;

        if (currency === "USD") {
            return "US$ " + new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(amount);
        }

        if (currency === "USDC") {
            return "USDC " + new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(amount);
        }

        return "$ " + new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(amount);
    }

    function convertToArs(value, currency) {
        return currency === "USD" || currency === "USDC" ? value * exchangeRate : value;
    }

    function today() {
        var now = new Date();
        return now.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric"
        });
    }

    function comparableDate(value) {
        var parts;

        if (/^\d{4}[/-]\d{2}[/-]\d{2}$/.test(value)) {
            return new Date(value.replace(/\//g, "-")).getTime();
        }

        parts = value.split(/[/-]/);

        if (parts.length === 3) {
            return new Date(parts[2], Number(parts[0]) - 1, parts[1]).getTime();
        }

        return 0;
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

    function totalIncomes() {
        return state.incomes.reduce(function (sum, income) { return sum + income.amount; }, 0);
    }

    function totalExpenses() {
        return state.expenses.reduce(function (sum, expense) { return sum + expense.amount; }, 0);
    }

    function totalGoalsInArs() {
        return state.goals.reduce(function (sum, goal) {
            return sum + convertToArs(goal.current, goal.currency);
        }, 0);
    }

    function defaultGoal() {
        return state.goals.find(function (goal) { return goal.isDefault; }) || state.goals[0];
    }

    function addToDefaultGoal(amountArs, reason) {
        var goal = defaultGoal();

        if (!goal || amountArs <= 0) {
            return;
        }

        var amountForGoal = goal.currency === "ARS" ? amountArs : amountArs / exchangeRate;
        goal.current = Math.min(goal.target, goal.current + amountForGoal);

        if (reason === "round-up") {
            state.lastRoundUp = amountArs;
        }

        if (reason === "retention") {
            state.lastRetention = amountArs;
        }

        state.savingsHistory.push(Math.round(totalGoalsInArs()));
        state.savingsHistory = state.savingsHistory.slice(-10);
    }

    function addIncome(income) {
        state.incomes.unshift(income);
        addToDefaultGoal(income.amount * retentionRate, "retention");
        saveState();
        renderAll();
    }

    function addExpense(expense) {
        state.expenses.unshift(expense);
        addToDefaultGoal(calculateRoundUp(expense), "round-up");
        saveState();
        renderAll();
    }

    function calculateRoundUp(expense) {
        var step = expense.displayCurrency === "USD" || expense.displayCurrency === "USDC" ? exchangeRate : 100;
        var rounded = Math.ceil(expense.amount / step) * step;

        return Math.max(0, rounded - expense.amount);
    }

    function totalsByCategory() {
        return state.expenses.reduce(function (acc, expense) {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {});
    }

    function updateSummaries() {
        var savingsTotal = totalGoalsInArs();
        var history = state.savingsHistory;
        var previous = history.length > 1 ? history[history.length - 2] : savingsTotal;
        var difference = savingsTotal - previous;

        $("#mainIncome").textContent = formatMoney(totalIncomes());
        $("#mainSpending").textContent = formatMoney(totalExpenses());
        $("#mainSavingsTotal").textContent = formatMoney(savingsTotal);
        $("#savingsComparison").textContent = (difference >= 0 ? "+" : "-") + formatMoney(Math.abs(difference)) + " vs medicion anterior";
        $("#incomeTotalLabel").textContent = state.incomes.length + " fuentes · " + formatMoney(totalIncomes());
        $("#expenseTotalLabel").textContent = state.expenses.length + " gastos · " + formatMoney(totalExpenses());
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
            legendButton.innerHTML = "<span><i style=\"background:" + color + "\"></i>" + escapeHtml(category) + "</span><strong>" + formatMoney(amount) + "</strong>";
            legendButton.addEventListener("click", function () {
                describeCategory(category, amount, total);
            });
            legend.appendChild(legendButton);
        });
    }

    function renderIncomeList() {
        var list = $("#incomeList");
        list.innerHTML = "";

        state.incomes.slice().sort(function (a, b) {
            return comparableDate(b.date) - comparableDate(a.date);
        }).forEach(function (income) {
            var item = document.createElement("article");
            item.className = "transaction-item";
            item.innerHTML = [
                "<span class=\"transaction-icon\">↗</span>",
                "<span><strong class=\"transaction-title\">" + escapeHtml(income.source) + "</strong>",
                "<small class=\"transaction-meta\">" + escapeHtml(income.date) + " · " + escapeHtml(income.recurrence) + " · " + escapeHtml(income.origin || "manual") + "</small></span>",
                "<strong class=\"transaction-amount positive\">" + formatMoney(income.amount) + "</strong>"
            ].join("");
            list.appendChild(item);
        });
    }

    function renderExpenseList() {
        var list = $("#expenseList");
        list.innerHTML = "";

        state.expenses.slice().sort(function (a, b) {
            return comparableDate(b.date) - comparableDate(a.date);
        }).forEach(function (expense) {
            var item = document.createElement("article");
            item.className = "transaction-item";
            item.innerHTML = [
                "<span class=\"transaction-icon\">" + escapeHtml(expense.icon || icons[expense.category] || icons.Otros) + "</span>",
                "<span><strong class=\"transaction-title\">" + escapeHtml(expense.description) + "</strong>",
                "<small class=\"transaction-meta\">" + escapeHtml(expense.date) + " · " + escapeHtml(expense.category) + " · " + escapeHtml(expense.origin || "manual") + "</small></span>",
                "<strong class=\"transaction-amount negative\">-" + formatMoney(expense.displayAmount || expense.amount, expense.displayCurrency) + "</strong>"
            ].join("");
            list.appendChild(item);
        });
    }

    function renderSavings() {
        var goal = defaultGoal();
        var percent = goal ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
        var unifiedUsd = (state.wallet.ARS / exchangeRate) + state.wallet.USD + state.wallet.USDC;
        var goalsList = $("#goalList");
        var maxHistory = Math.max.apply(null, state.savingsHistory.concat([1]));

        $("#walletArs").textContent = formatMoney(state.wallet.ARS);
        $("#walletUsd").textContent = formatMoney(state.wallet.USD, "USD");
        $("#walletUsdc").textContent = formatMoney(state.wallet.USDC, "USDC");
        $("#unifiedTotal").textContent = formatMoney(unifiedUsd, "USD");
        $("#exchangeRateLabel").textContent = "Convertido con tipo de cambio de mercado simulado: ARS " + exchangeRate + " / USD";
        $("#defaultGoalPercent").textContent = percent + "%";
        $("#defaultGoalName").textContent = goal ? goal.name : "Meta default";
        $("#defaultGoalRing").style.background = "conic-gradient(var(--primary) 0 " + percent + "%, var(--surface-strong) " + percent + "% 100%)";
        $("#savingsWidgetCopy").textContent = "Este mes se pre-asignaron " + formatMoney(state.lastRetention) + " por ingresos y " + formatMoney(state.lastRoundUp) + " por redondeos.";
        $("#roundUpCopy").textContent = "Ultimo redondeo asignado a la meta default: " + formatMoney(state.lastRoundUp) + ".";
        $("#retentionCopy").textContent = "Regla activa: " + Math.round(retentionRate * 100) + "% de cada ingreso se reserva. Ultimo calculo: " + formatMoney(state.lastRetention) + ".";

        goalsList.innerHTML = "";
        state.goals.forEach(function (item) {
            var itemPercent = Math.min(100, Math.round((item.current / item.target) * 100));
            var card = document.createElement("article");
            card.className = "goal-card";
            card.innerHTML = [
                "<div>",
                "<h4>" + escapeHtml(item.name) + (item.isDefault ? " · Default" : "") + "</h4>",
                "<span>" + formatMoney(item.current, item.currency) + " / " + formatMoney(item.target, item.currency) + (item.deadline ? " · " + escapeHtml(item.deadline) : "") + "</span>",
                "</div>",
                "<progress max=\"100\" value=\"" + itemPercent + "\"></progress>"
            ].join("");
            goalsList.appendChild(card);
        });

        $("#savingsChart").innerHTML = "";
        state.savingsHistory.forEach(function (value) {
            var bar = document.createElement("span");
            bar.style.height = Math.max(12, Math.round((value / maxHistory) * 100)) + "%";
            bar.setAttribute("title", formatMoney(value));
            $("#savingsChart").appendChild(bar);
        });
    }

    function renderAll() {
        updateSummaries();
        renderPieChart();
        renderIncomeList();
        renderExpenseList();
        renderSavings();
    }

    function inferCategory(text) {
        var normalized = text.toLowerCase();

        if (/cafe|café|super|mercado|cena|almuerzo|restaurant|comida|food|coffee|dinner/.test(normalized)) {
            return "Alimentos";
        }

        if (/luz|gas|agua|internet|telefono|servicio|utility|bill|electric/.test(normalized)) {
            return "Servicios";
        }

        if (/cine|bar|amigos|juego|movie|game|show|teatro|friends/.test(normalized)) {
            return "Entretenimiento";
        }

        if (/taxi|uber|subte|tren|bus|nafta|transport|fuel|metro/.test(normalized)) {
            return "Transporte";
        }

        if (/spotify|netflix|suscrip|subscription|software|musica|music|saas/.test(normalized)) {
            return "Musica/Suscripciones";
        }

        return "Otros";
    }

    function parseBotMessage(message) {
        var amountMatch = message.match(/(?:us\$|usd|ars|usdc)?\s*([0-9]+(?:[.,][0-9]+)?)(?:\s*(usd|usdc|ars))?/i);

        if (!amountMatch) {
            return null;
        }

        var numericValue = Number(amountMatch[1].replace(",", "."));
        var currency = (amountMatch[2] || (/usdc/i.test(message) ? "USDC" : (/usd|us\$/i.test(message) ? "USD" : "ARS"))).toUpperCase();
        var description = message.replace(amountMatch[0], "").trim() || "Gasto por WhatsApp";
        var category = inferCategory(description);
        var amountInArs = convertToArs(numericValue, currency);

        return {
            description: description,
            category: category,
            amount: Math.round(amountInArs),
            displayAmount: numericValue,
            displayCurrency: currency === "ARS" ? undefined : currency,
            date: today(),
            icon: icons[category] || icons.Otros,
            origin: "whatsapp"
        };
    }

    function initForms() {
        $("#incomeForm").addEventListener("submit", function (event) {
            event.preventDefault();
            addIncome({
                source: $("#incomeSource").value,
                amount: Number($("#incomeAmount").value),
                recurrence: $("#incomeRecurrence").value,
                date: today(),
                origin: "manual"
            });
            event.target.reset();
        });

        $("#incomeFab").addEventListener("click", function () {
            $("#incomeAmount").focus();
        });

        $("#expenseForm").addEventListener("submit", function (event) {
            event.preventDefault();
            var category = $("#expenseCategory").value;
            addExpense({
                description: $("#expenseDescription").value || "Gasto manual",
                category: category,
                amount: Number($("#expenseAmount").value),
                date: today(),
                icon: icons[category] || icons.Otros,
                origin: "manual"
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

        $("#goalForm").addEventListener("submit", function (event) {
            event.preventDefault();
            state.goals.push({
                name: $("#goalName").value,
                target: Number($("#goalTarget").value),
                current: 0,
                currency: $("#goalCurrency").value,
                deadline: $("#goalDeadline").value,
                isDefault: state.goals.length === 0
            });
            saveState();
            renderAll();
            event.target.reset();
        });
    }

    function parseAmount(raw) {
        var text = raw.replace(/\s/g, "");
        var hasComma = text.indexOf(",") > -1;
        var hasDot = text.indexOf(".") > -1;

        if (hasComma && hasDot) {
            var lastComma = text.lastIndexOf(",");
            var lastDot = text.lastIndexOf(".");
            text = lastComma > lastDot ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
        } else if (hasComma) {
            text = text.replace(",", ".");
        }

        return Number(text);
    }

    function parseStatementLine(line, index) {
        var dateMatch = line.match(/(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2})/);
        var amountMatch = line.match(/([+-]?\s*(?:\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d{2})?)\s*(ars|usd|usdc)?\s*$/i);

        if (!dateMatch || !amountMatch) {
            return null;
        }

        var currency = (amountMatch[2] || (/usd|us\$/.test(line.toLowerCase()) ? "USD" : "ARS")).toUpperCase();
        var rawAmount = parseAmount(amountMatch[1]);
        var description = line
            .replace(dateMatch[0], "")
            .replace(amountMatch[0], "")
            .replace(/\b(debit|credit|debito|credito|débito|crédito|income|expense|egreso|ingreso)\b/ig, "")
            .trim();
        var explicitDebit = /debit|debito|débito|expense|egreso/i.test(line);
        var explicitCredit = /salary|sueldo|transferencia recibida|deposit|deposito|depósito|income|ingreso|credit|credito|crédito/i.test(line);
        var isIncome = !explicitDebit && (rawAmount > 0 || explicitCredit);
        var amount = Math.abs(rawAmount);
        var amountInArs = convertToArs(amount, currency);

        return {
            id: "candidate-" + index + "-" + Date.now(),
            date: dateMatch[0],
            description: description || "Movimiento detectado",
            category: isIncome ? "Ingreso" : inferCategory(description),
            type: isIncome ? "Ingreso/Credito" : "Gasto/Debito",
            movement: isIncome ? "income" : "expense",
            amount: Math.round(amountInArs),
            displayAmount: amount,
            displayCurrency: currency === "ARS" ? undefined : currency,
            approved: true
        };
    }

    function renderParserResults(results) {
        var tbody = $("#parserResults");
        var total = results.reduce(function (sum, transaction) { return sum + transaction.amount; }, 0);
        tbody.innerHTML = "";

        results.forEach(function (transaction, index) {
            var row = document.createElement("tr");
            var categories = ["Alimentos", "Servicios", "Entretenimiento", "Transporte", "Musica/Suscripciones", "Otros"];
            row.innerHTML = [
                "<td><input type=\"checkbox\" class=\"approval-check\" data-index=\"" + index + "\" " + (transaction.approved ? "checked" : "") + "></td>",
                "<td>" + escapeHtml(transaction.date) + "</td>",
                "<td>" + escapeHtml(transaction.description) + "</td>",
                "<td>" + (transaction.movement === "income" ? "Ingreso" : categorySelect(categories, transaction.category, index)) + "</td>",
                "<td>" + escapeHtml(transaction.type) + "</td>",
                "<td>" + formatMoney(transaction.displayAmount || transaction.amount, transaction.displayCurrency) + "</td>"
            ].join("");
            tbody.appendChild(row);
        });

        $("#parserCount").textContent = results.length + (results.length === 1 ? " item" : " items") + " · " + formatMoney(total);
        updateApprovalSummary();
    }

    function categorySelect(categories, selected, index) {
        return "<select class=\"category-review\" data-index=\"" + index + "\">" + categories.map(function (category) {
            return "<option" + (category === selected ? " selected" : "") + ">" + category + "</option>";
        }).join("") + "</select>";
    }

    function updateApprovalSummary() {
        var approved = state.statementCandidates.filter(function (transaction) { return transaction.approved; });
        var total = approved.reduce(function (sum, transaction) { return sum + transaction.amount; }, 0);
        $("#approvalSummary").textContent = approved.length + " aprobados · volumen " + formatMoney(total);
    }

    function initParser() {
        var form = $("#parserForm");

        function process() {
            var text = $("#statementText").value;
            state.statementCandidates = text
                .split(/\n+/)
                .map(function (line, index) { return parseStatementLine(line.trim(), index); })
                .filter(Boolean);

            renderParserResults(state.statementCandidates);
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            process();
        });

        $("#parserResults").addEventListener("change", function (event) {
            var index = Number(event.target.getAttribute("data-index"));
            var candidate = state.statementCandidates[index];

            if (!candidate) {
                return;
            }

            if (event.target.classList.contains("approval-check")) {
                candidate.approved = event.target.checked;
            }

            if (event.target.classList.contains("category-review")) {
                candidate.category = event.target.value;
            }

            updateApprovalSummary();
        });

        $("#approveTransactions").addEventListener("click", function () {
            var approved = state.statementCandidates.filter(function (transaction) { return transaction.approved; });

            approved.forEach(function (transaction) {
                if (transaction.movement === "income") {
                    addIncome({
                        source: transaction.description,
                        amount: transaction.amount,
                        recurrence: "This month only",
                        date: transaction.date,
                        origin: "statement"
                    });
                    return;
                }

                addExpense({
                    description: transaction.description,
                    category: transaction.category,
                    amount: transaction.amount,
                    displayAmount: transaction.displayAmount,
                    displayCurrency: transaction.displayCurrency,
                    date: transaction.date,
                    icon: icons[transaction.category] || icons.Otros,
                    origin: "statement"
                });
            });

            state.statementCandidates = [];
            renderParserResults([]);
            saveState();
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
