function queryHandler(query) {
    let containerFilter = []
    for (let key in query) {
        if (key == 'month') {
            key = `(EXTRACT(month from  plan_check_dt), EXTRACT('year' from plan_check_dt))=(${+query['month'].split('-')[1]},${+query['month'].split('-')[0]})`
            containerFilter.push(`${key}`)
        } else if (key == 'yearonly') {
            key = `EXTRACT('year' from plan_check_dt)=${+query['yearonly']}`
            containerFilter.push(`${key}`)
        } else if (key == 'date') {
            const dateParts = query['date'].split('-')
            const formattedDate = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`
            containerFilter.push(`EXTRACT('year' from plan_check_dt)=${dateParts[0]} AND EXTRACT(month from plan_check_dt)=${dateParts[1]} AND EXTRACT(day from plan_check_dt)=${dateParts[2]}`)
        }
    }
    delete query.month
    delete query.year
    delete query.yearonly
    delete query.date
    for (const key in query) {
        let value = query[key]
        if (value !== 'null' && value && value != -1) containerFilter.push(`${key} = '${value}'`)
        if (value == '0') containerFilter.push(`${key} = '${value}'`)
    }
    return containerFilter
}

module.exports = queryHandler