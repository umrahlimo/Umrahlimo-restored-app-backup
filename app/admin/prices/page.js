'use client'

import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../components/AdminLayout'
import styles from '../admin.module.scss'
import { db } from '../../../lib/firebase'
import { collection, getDocs, doc, setDoc, query, orderBy } from 'firebase/firestore'

export default function PriceMarkupPage() {
    const [routes, setRoutes] = useState([])
    const [vehicleTypes, setVehicleTypes] = useState([])
    const [costPrices, setCostPrices] = useState({})
    const [markups, setMarkups] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [globalMarkup, setGlobalMarkup] = useState(30)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeVehicle, setActiveVehicle] = useState('')

    useEffect(() => {
        loadAllData()
    }, [])

    const loadAllData = async () => {
        setLoading(true)
        try {
            const [routesSnap, vtSnap, costSnap, markupSnap] = await Promise.all([
                getDocs(query(collection(db, 'routes'), orderBy('createdAt', 'desc'))),
                getDocs(query(collection(db, 'vehicleTypes'), orderBy('createdAt', 'desc'))),
                getDocs(collection(db, 'routeCostPrices')),
                getDocs(collection(db, 'routeMarkups'))
            ])

            const routesData = routesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
            const vtData = vtSnap.docs.map(d => ({ id: d.id, ...d.data() }))

            const costs = {}
            costSnap.docs.forEach(d => {
                const data = d.data()
                costs[data.vehicleTypeName || d.id] = data.prices || {}
            })

            const mkData = {}
            markupSnap.docs.forEach(d => {
                const data = d.data()
                if (data.vehicleTypeName) {
                    mkData[data.vehicleTypeName] = data.markups || {}
                    if (data.globalMarkup !== undefined) {
                        setGlobalMarkup(data.globalMarkup)
                    }
                }
            })

            setRoutes(routesData)
            setVehicleTypes(vtData)
            setCostPrices(costs)
            setMarkups(mkData)

            // Set first vehicle as active
            const names = new Set(vtData.map(v => v.name))
            Object.keys(costs).forEach(n => names.add(n))
            const allNames = [...names]
            if (allNames.length > 0 && !allNames.includes('')) {
                setActiveVehicle(allNames[0])
            }
        } catch (error) {
            console.error('Error loading pricing data:', error)
        } finally {
            setLoading(false)
        }
    }

    const allVehicleNames = useMemo(() => {
        const names = new Set(vehicleTypes.map(v => v.name))
        Object.keys(costPrices).forEach(n => names.add(n))
        return [...names]
    }, [vehicleTypes, costPrices])

    // Set active vehicle when names load
    useEffect(() => {
        if (allVehicleNames.length > 0 && !activeVehicle) {
            setActiveVehicle(allVehicleNames[0])
        }
    }, [allVehicleNames])

    const filteredRoutes = useMemo(() => {
        if (!searchTerm.trim()) return routes
        const q = searchTerm.toLowerCase()
        return routes.filter(r =>
            r.name?.toLowerCase().includes(q) ||
            r.fromLabel?.toLowerCase().includes(q) ||
            r.toLabel?.toLowerCase().includes(q)
        )
    }, [routes, searchTerm])

    const getMarkup = (vehicleType, routeName) => {
        return markups[vehicleType]?.[routeName] ?? globalMarkup
    }

    const getCost = (vehicleType, routeName) => {
        return parseFloat(costPrices[vehicleType]?.[routeName]) || 0
    }

    const getSellingPrice = (vehicleType, routeName) => {
        const cost = getCost(vehicleType, routeName)
        const mkup = getMarkup(vehicleType, routeName)
        return Math.round(cost * (1 + mkup / 100))
    }

    const handleMarkupChange = (vehicleType, routeName, value) => {
        setMarkups(prev => ({
            ...prev,
            [vehicleType]: {
                ...(prev[vehicleType] || {}),
                [routeName]: parseFloat(value) || 0
            }
        }))
    }

    const applyGlobalToAll = () => {
        const newMarkups = {}
        allVehicleNames.forEach(vt => {
            newMarkups[vt] = { ...(markups[vt] || {}) }
            routes.forEach(route => {
                newMarkups[vt][route.name] = globalMarkup
            })
        })
        setMarkups(newMarkups)
    }

    const applyGlobalToCurrentVehicle = () => {
        if (!activeVehicle) return
        setMarkups(prev => {
            const updated = { ...(prev[activeVehicle] || {}) }
            routes.forEach(route => {
                updated[route.name] = globalMarkup
            })
            return { ...prev, [activeVehicle]: updated }
        })
    }

    const sanitizeDocId = (name) => name.replace(/[^a-zA-Z0-9]/g, '_')

    const saveAllMarkups = async () => {
        setSaving(true)
        try {
            const promises = allVehicleNames.map(vt => {
                const docId = sanitizeDocId(vt)
                return setDoc(doc(db, 'routeMarkups', docId), {
                    vehicleTypeName: vt,
                    markups: markups[vt] || {},
                    globalMarkup: globalMarkup,
                    updatedAt: new Date()
                })
            })
            await Promise.all(promises)
            alert('All markups saved successfully!')
        } catch (error) {
            console.error('Error saving markups:', error)
            alert('Failed to save markups')
        } finally {
            setSaving(false)
        }
    }

    const routesWithPricing = useMemo(() => {
        let count = 0
        routes.forEach(r => {
            const hasAnyPrice = allVehicleNames.some(vt => getCost(vt, r.name) > 0)
            if (hasAnyPrice) count++
        })
        return count
    }, [routes, allVehicleNames, costPrices])

    // Count routes with cost for active vehicle
    const activeVehicleRoutesWithCost = useMemo(() => {
        if (!activeVehicle) return 0
        return routes.filter(r => getCost(activeVehicle, r.name) > 0).length
    }, [activeVehicle, routes, costPrices])

    return (
        <AdminLayout
            pageTitle="Price & Markup Management"
            pageDescription="Set commission markup per route per vehicle. Final price = Cost + Markup %"
        >
            {/* Stats Row */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px', marginBottom: '24px'
            }}>
                {[
                    { label: 'Total Routes', value: routes.length, color: 'var(--admin-gold)' },
                    { label: 'Vehicle Types', value: allVehicleNames.length, color: 'var(--admin-gold)' },
                    { label: 'Routes with Pricing', value: routesWithPricing, color: 'var(--admin-success)' },
                    { label: 'Default Markup', value: globalMarkup + '%', color: 'var(--admin-warning)' }
                ].map((stat, i) => (
                    <div key={i} style={{
                        background: 'var(--admin-bg-secondary)', borderRadius: '12px', padding: '16px 20px',
                        border: '1px solid var(--admin-border)'
                    }}>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '4px' }}>{stat.label}</div>
                        <div style={{ fontSize: '26px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Vehicle Tabs */}
            <div style={{
                display: 'flex', gap: '6px', marginBottom: '0', overflowX: 'auto',
                padding: '0 0 0 0', scrollbarWidth: 'none', maxWidth: '100%'
            }}>
                {allVehicleNames.map(vt => {
                    const isActive = activeVehicle === vt
                    const hasCosts = Object.values(costPrices[vt] || {}).some(v => parseFloat(v) > 0)
                    return (
                        <button
                            key={vt}
                            onClick={() => setActiveVehicle(vt)}
                            style={{
                                padding: '10px 18px',
                                borderRadius: '10px 10px 0 0',
                                border: isActive ? '1px solid var(--admin-border)' : '1px solid transparent',
                                borderBottom: isActive ? '1px solid var(--admin-bg-secondary)' : '1px solid transparent',
                                background: isActive ? 'var(--admin-bg-secondary)' : 'transparent',
                                color: isActive ? 'var(--admin-gold)' : 'var(--admin-text-muted)',
                                fontWeight: isActive ? '700' : '500',
                                fontSize: '13px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                marginBottom: '-1px',
                                zIndex: isActive ? 2 : 1
                            }}
                        >
                            {vt}
                            {hasCosts && (
                                <span style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    background: 'var(--admin-success)', display: 'inline-block',
                                    marginLeft: '6px', verticalAlign: 'middle'
                                }} />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Main Table Container */}
            <div className={styles.tableContainer} style={{ borderRadius: '0 12px 12px 12px', overflow: 'hidden' }}>
                {/* Table Header with Controls */}
                <div className={styles.tableHeader} style={{ flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 auto', minWidth: 0 }}>
                        <h3 className={styles.tableTitle} style={{ margin: 0 }}>
                            {activeVehicle || 'Select Vehicle'}
                        </h3>
                        {activeVehicle && (
                            <span style={{
                                fontSize: '12px', color: 'var(--admin-text-muted)',
                                background: 'var(--admin-bg-tertiary)', padding: '4px 10px',
                                borderRadius: '20px'
                            }}>
                                {activeVehicleRoutesWithCost} / {routes.length} routes priced
                            </span>
                        )}
                    </div>
                    <div className={styles.tableActions} style={{ flexWrap: 'wrap', gap: '8px' }}>
                        <div className={styles.searchInput}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search routes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'var(--admin-bg-tertiary)', borderRadius: '8px',
                            padding: '4px 10px', border: '1px solid var(--admin-border)'
                        }}>
                            <label style={{ fontSize: '12px', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>Markup:</label>
                            <input
                                type="number"
                                value={globalMarkup}
                                onChange={(e) => setGlobalMarkup(parseFloat(e.target.value) || 0)}
                                min="0" max="500"
                                style={{
                                    width: '55px', padding: '6px 4px', borderRadius: '6px',
                                    border: '1px solid var(--admin-border)',
                                    background: 'var(--admin-bg)', color: 'var(--admin-gold)',
                                    fontSize: '13px', textAlign: 'center', fontWeight: '700'
                                }}
                            />
                            <span style={{ fontSize: '13px', color: 'var(--admin-gold)', fontWeight: '600' }}>%</span>
                        </div>
                        <button
                            onClick={applyGlobalToCurrentVehicle}
                            style={{
                                padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                                background: 'transparent', color: 'var(--admin-warning)',
                                border: '1px solid var(--admin-warning)', cursor: 'pointer', whiteSpace: 'nowrap',
                                fontWeight: '600'
                            }}
                            title={`Apply ${globalMarkup}% to all routes for ${activeVehicle}`}
                        >
                            Apply to {activeVehicle ? activeVehicle.split(' ')[0] : 'Vehicle'}
                        </button>
                        <button
                            onClick={applyGlobalToAll}
                            style={{
                                padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                                background: 'transparent', color: 'var(--admin-text-muted)',
                                border: '1px solid var(--admin-border)', cursor: 'pointer', whiteSpace: 'nowrap',
                                fontWeight: '500'
                            }}
                            title={`Apply ${globalMarkup}% to ALL vehicles, ALL routes`}
                        >
                            Apply All Vehicles
                        </button>
                        <button
                            className={styles.addBtn}
                            onClick={saveAllMarkups}
                            disabled={saving}
                            style={{ background: 'var(--admin-success)', color: '#fff' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px' }}>
                                <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
                            </svg>
                            {saving ? 'Saving...' : 'Save All'}
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                    </div>
                ) : !activeVehicle ? (
                    <div className={styles.emptyState}>
                        <h3>Select a Vehicle</h3>
                        <p>Click a vehicle tab above to view and set markup prices.</p>
                    </div>
                ) : routes.length === 0 ? (
                    <div className={styles.emptyState}>
                        <h3>No Routes Found</h3>
                        <p>Add routes from the portal admin panel first, then set pricing here.</p>
                    </div>
                ) : (
                    <div style={{ overflowY: 'auto', overflowX: 'auto', maxHeight: 'calc(100vh - 380px)' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{
                                        position: 'sticky', top: 0, zIndex: 2,
                                        background: 'var(--admin-bg-tertiary)', width: '40px',
                                        textAlign: 'center', padding: '12px 8px'
                                    }}>
                                        #
                                    </th>
                                    <th style={{
                                        position: 'sticky', top: 0, zIndex: 2,
                                        background: 'var(--admin-bg-tertiary)', padding: '12px 16px'
                                    }}>
                                        Route
                                    </th>
                                    <th style={{
                                        position: 'sticky', top: 0, zIndex: 2,
                                        background: 'var(--admin-bg-tertiary)', textAlign: 'center',
                                        width: '120px', padding: '12px 16px'
                                    }}>
                                        Cost Price
                                    </th>
                                    <th style={{
                                        position: 'sticky', top: 0, zIndex: 2,
                                        background: 'var(--admin-bg-tertiary)', textAlign: 'center',
                                        width: '140px', padding: '12px 16px',
                                        color: 'var(--admin-warning)'
                                    }}>
                                        Markup %
                                    </th>
                                    <th style={{
                                        position: 'sticky', top: 0, zIndex: 2,
                                        background: 'var(--admin-bg-tertiary)', textAlign: 'center',
                                        width: '140px', padding: '12px 16px',
                                        color: 'var(--admin-success)'
                                    }}>
                                        Selling Price
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRoutes.map((route, idx) => {
                                    const cost = getCost(activeVehicle, route.name)
                                    const mkup = getMarkup(activeVehicle, route.name)
                                    const selling = getSellingPrice(activeVehicle, route.name)
                                    return (
                                        <tr key={route.id} style={{
                                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                                        }}>
                                            <td style={{
                                                textAlign: 'center', color: 'var(--admin-text-muted)',
                                                fontSize: '12px', padding: '10px 8px'
                                            }}>
                                                {idx + 1}
                                            </td>
                                            <td style={{ padding: '10px 16px' }}>
                                                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--admin-text)', lineHeight: '1.4' }}>
                                                    {route.fromLabel && route.toLabel ? (
                                                        <>
                                                            <span style={{ color: 'var(--admin-success)' }}>{route.fromLabel}</span>
                                                            <span style={{ color: 'var(--admin-text-muted)', margin: '0 8px' }}>→</span>
                                                            <span style={{ color: '#ef4444' }}>{route.toLabel}</span>
                                                        </>
                                                    ) : (
                                                        route.name
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                                                    {route.name}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center', padding: '10px 16px' }}>
                                                {cost > 0 ? (
                                                    <span style={{
                                                        fontSize: '15px', fontWeight: '700', color: 'var(--admin-text)',
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        {cost.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>Not set</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'center', padding: '10px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                    <input
                                                        type="number"
                                                        value={mkup}
                                                        onChange={(e) => handleMarkupChange(activeVehicle, route.name, e.target.value)}
                                                        min="0" max="500"
                                                        style={{
                                                            width: '65px', padding: '8px 6px', borderRadius: '8px',
                                                            border: '2px solid var(--admin-border)',
                                                            background: 'var(--admin-bg-tertiary)',
                                                            color: 'var(--admin-warning)', fontSize: '14px',
                                                            textAlign: 'center', fontWeight: '700',
                                                            fontFamily: 'monospace',
                                                            transition: 'border-color 0.2s ease'
                                                        }}
                                                        onFocus={(e) => e.target.style.borderColor = 'var(--admin-warning)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'var(--admin-border)'}
                                                    />
                                                    <span style={{ color: 'var(--admin-warning)', fontWeight: '600', fontSize: '13px' }}>%</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center', padding: '10px 16px' }}>
                                                {selling > 0 ? (
                                                    <span style={{
                                                        fontSize: '16px', fontWeight: '800',
                                                        color: 'var(--admin-success)',
                                                        fontFamily: 'monospace',
                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                        padding: '4px 12px', borderRadius: '8px'
                                                    }}>
                                                        {selling.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Legend */}
                {!loading && routes.length > 0 && activeVehicle && (
                    <div style={{
                        display: 'flex', gap: '24px', padding: '14px 20px',
                        borderTop: '1px solid var(--admin-border)', fontSize: '12px',
                        color: 'var(--admin-text-muted)', flexWrap: 'wrap', alignItems: 'center'
                    }}>
                        <span>💡 <strong style={{ color: 'var(--admin-text-secondary)' }}>Formula:</strong> Selling = Cost × (1 + Markup%/100)</span>
                        <span>Cost = set on portal admin per route</span>
                        <span style={{ color: 'var(--admin-warning)' }}>Markup % = your commission</span>
                        <span style={{ color: 'var(--admin-success)' }}>Selling = final customer price</span>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
