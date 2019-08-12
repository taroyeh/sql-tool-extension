// Required: PoorMansTSqlFormatterJS.min.js

(function() {
	// DO NOT use directly, you should use cloneDefaultOptions() to get a cloned options
	const defaultOptions = {
		// General
		f5_execute: true,
		sql_formatter: true,
		auto_load_next_page: true,
		colorful_sql: true,
		show_row_number: true,
		show_cell_title: true,
		auto_update_url: true,
		editor_font_size: 16,
		// Default SQL
		default_sql: "Keep on working...",
		// Colors
		color_sql_editor_background: "E5F1F4",
		color_sql_editor_border: "C4C9FD",
		color_sql_editor_line_number: "FFFFFF",
		color_sql_editor_line_number_background: "5BAFC7",
		color_result_alternative_row_background: "DAEEF3",
		color_result_mouse_over_row_background: "A2DEE8",
		color_result_selected_row_background: "CFCFCF",
		// Format
		format_indent_string: "  ",
		format_spaces_per_tab: 2,
		format_max_line_width: 999,
		format_new_statement_line_breaks: 2,
		format_new_clause_line_breaks: 1,
		format_expand_comma_lists: true,
		format_trailing_commas: false,
		format_space_after_expanded_comma: false,
		format_expand_booleane_expressions: true,
		format_expand_case_statements: true,
		format_expand_between_conditions: true,
		format_expand_in_lists: true,
		format_break_join_on_sections: true,
		format_uppercase_keywords: true,
		format_html_coloring: false,
		format_keyword_standardization: false
	};

	const internalMessageHandler = function(request, sender, responseCallback) {
		if (!request || !request.method) {
			return errorResultHandler("Method not found.", responseCallback);
		}
		switch (request.method) {
			case "getDefaultOptions":
				return successResultHandler(cloneDefaultOptions(), responseCallback);
			case "getOptions":
				return getOptionsResponse(responseCallback);
			case "setOptions":
				return setOptionsResponse(request, responseCallback);
			case "formatSql":
				return formatSqlResponse(request, responseCallback);
			default:
				return errorResultHandler("Wrong method.", responseCallback);
		}
	};
	const externalMessageHandler = function(request, sender, responseCallback) {
		if (!request || !request.method) {
			return errorResultHandler("Method not found.", responseCallback);
		}
		switch (request.method) {
			// Add allowed methods in white list below, pass it to internal handler
			case "formatSql":
				return internalMessageHandler(request, sender, responseCallback);
			default:
				return errorResultHandler("Wrong method.", responseCallback);
		}
	}
	chrome.runtime.onMessageExternal.addListener(externalMessageHandler);
	chrome.runtime.onMessage.addListener(internalMessageHandler);

	// responseCallback = function(response) { ... }
	function successResultHandler(result, responseCallback) {
		const response = {
			success: true,
			message: "",
			data: result
		};
		responseCallback(response);
		return false; // no wait callback
	}

	// responseCallback = function(response) { ... }
	function errorResultHandler(message, responseCallback) {
		const response = {
			success: false,
			message: message,
			data: null
		};
		responseCallback(response);
		return false; // no wait callback
	}

	function cloneDefaultOptions() {
		return Object.assign({}, defaultOptions);
	}

	// callback = function(options) { ... }
	function getOptions(callback) {
		chrome.storage.sync.get(cloneDefaultOptions(), callback);
		return true; // wait callback
	}

	function parseToFormatOptions(options) {
		const stdOptions = new PoorMansTSqlFormatterLib.Formatters.TSqlStandardFormatterOptions();
		return Object.assign(stdOptions, {
			IndentString: options.format_indent_string,
			SpacesPerTab: options.format_spaces_per_tab,
			MaxLineWidth: options.format_max_line_width,
			NewStatementLineBreaks: options.format_new_statement_line_breaks,
			NewClauseLineBreaks: options.format_new_clause_line_breaks,
			ExpandCommaLists: options.format_expand_comma_lists,
			TrailingCommas: options.format_trailing_commas,
			SpaceAfterExpandedComma: options.format_space_after_expanded_comma,
			ExpandBooleanExpressions: options.format_expand_booleane_expressions,
			ExpandCaseStatements: options.format_expand_case_statements,
			ExpandBetweenConditions: options.format_expand_between_conditions,
			ExpandInLists: options.format_expand_in_lists,
			BreakJoinOnSections: options.format_break_join_on_sections,
			UppercaseKeywords: options.format_uppercase_keywords,
			HTMLColoring: options.format_html_coloring,
			KeywordStandardization: options.format_keyword_standardization
		});
	}

	// callback = function(formatOptions) { ... }
	function getFormatOptions(callback) {
		return getOptions(function(options) {
			const formatOptions = parseToFormatOptions(options);
			callback(formatOptions);
		});
	}

	let sqlFormatter = new PoorMansTSqlFormatterLib.Formatters.TSqlStandardFormatter.$ctor1(parseToFormatOptions(cloneDefaultOptions()));
	const tokenizer = new PoorMansTSqlFormatterLib.Tokenizers.TSqlStandardTokenizer();
	const parser = new PoorMansTSqlFormatterLib.Parsers.TSqlStandardParser();

	function formatSql(sql) {
		const tokenizedData = tokenizer.TokenizeSQL(sql);
		const parsedData = parser.ParseSQL(tokenizedData);
		return sqlFormatter.FormatSQLTree(parsedData);
	}

	// responseCallback = function(response) { ... }
	function getOptionsResponse(responseCallback) {
		return getOptions(function(options) {
			return successResultHandler(options, responseCallback);
		});
	}

	// request = { options: { ... } }
	// responseCallback = function(response) { ... }
	function setOptionsResponse(request, responseCallback) {
		if (!request.options) {
			return errorResultHandler("options not found.", responseCallback);
		}
		chrome.storage.sync.set(request.options, function() {
			const formatOptions = parseToFormatOptions(request.options);
			sqlFormatter = new PoorMansTSqlFormatterLib.Formatters.TSqlStandardFormatter.$ctor1(formatOptions);
			return successResultHandler(request.options, responseCallback);
		});
		return true; // wait callback
	}

	// request = { sql: "SQL text" }
	// responseCallback = function(response) { ... }
	function formatSqlResponse(request, responseCallback) {
		if (!request.sql) {
			return errorResultHandler("sql not found.", responseCallback);
		}
		const formattedSql = formatSql(request.sql);
		return successResultHandler(formattedSql, responseCallback);
	}
})();
