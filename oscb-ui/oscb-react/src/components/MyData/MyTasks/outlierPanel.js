// OutlierTable with confirmed delete and undo (reverse) support
import React, { useMemo, useState } from "react";
import { Table, Button, Popconfirm, message, Modal, Tooltip } from "antd";
import CreatableSelect from "react-select/creatable";

const ellipsisStyle = {
    maxWidth: 120,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    whiteSpace: "normal",
};

export default function OutlierTable({ data = [], options = [ true, false ], onSubmit }) {
    // ---- utilities ----
    const toRows = (obj) => {
        const keys = Object.keys(obj);
        const length = obj[keys[0]].length;
        return Array.from({ length }, (_, i) => {
            const row = { key: String(i) };
            keys.forEach((k) => (row[k] = obj[k][i]));
            return row;
        });
    };
    data = toRows(data);
    const safeData = Array.isArray(data) ? data : [];

    const [tableData, setTableData] = useState(
        safeData.map((row) => ({ ...row, __original: row.discard, __originalOutlier: row.outlier }))
    );
    const [deletedRows, setDeletedRows] = useState([]); // store deleted row objects

    const handleDiscardChange = (selectedOption, record) => {
        const newValue = selectedOption ? selectedOption.value : null;
        setTableData((prev) =>
            prev.map((row) =>
                row.Cluster === record.Cluster ? { ...row, discard: newValue } : row
            )
        );
    };

    const handleOutlierChange = (selectedOption, record) => {
        const newValue = selectedOption ? selectedOption.value : null;
        setTableData((prev) =>
            prev.map((row) =>
                row.Cluster === record.Cluster ? { ...row, outlier: newValue } : row
            )
        );
    };

    const handleDelete = (record) => {
        setDeletedRows((prev) => [...prev, record]);
        setTableData((prev) => prev.filter((r) => r.Cluster !== record.Cluster));
        message.info(`Row Cluster ${record.Cluster} deleted`);
    };

    const handleUndoDelete = () => {
        if (deletedRows.length === 0) {
            message.info("No deleted rows to restore");
            return;
        }
        setTableData((prev) => [...prev, ...deletedRows].sort((a, b) => Number(a.Cluster) - Number(b.Cluster)));
        setDeletedRows([]);
        message.success("Deleted rows restored");
    };

    const handleSubmit = () => {
        if (tableData.length === 0 && deletedRows.length === 0) {
            message.warning("No data to submit");
            return;
        }

        Modal.confirm({
            title: 'Confirm Submit',
            content: 'Are you sure you want to submit the changes?',
            okText: 'Yes',
            cancelText: 'No',
            onOk: () => {
                // Include ALL current discard values
                const updatedDiscardAll = tableData.map((r) => ({
                    Cluster: r.Cluster,
                    discard: r.discard,
                }));

                // Include ONLY changed discard values
                const updatedDiscardChangedOnly = tableData
                    .filter((r) => r.discard !== r.__original)
                    .map((r) => ({
                        Cluster: r.Cluster,
                        discard: r.discard,
                    }));

                const updatedOutlierAll = tableData.map((r) => ({
                    Cluster: r.Cluster,
                    outlier: r.outlier,
                }));

                const updatedOutlierChangedOnly = tableData
                    .filter((r) => r.outlier !== r.__originalOutlier)
                    .map((r) => ({
                        Cluster: r.Cluster,
                        outlier: r.outlier,
                    }));

                const deleted = deletedRows.map((r) => r.Cluster);

                const payload = {
                    updatedDiscardAll,
                    updatedDiscardChangedOnly,
                    updatedOutlierAll,
                    updatedOutlierChangedOnly,
                    deleted,
                };

                onSubmit?.(payload);
                // message.success("Submission payload generated");
            }
        });
    };

    const columns = useMemo(() => {
        if (!tableData.length) return [];

        const keys = Object.keys(tableData[0] || {}).filter((k) => k !== "__original" && k !== "__originalOutlier" && k !== "key");

        const cols = keys.map((key) => {
            const uniqueValues = [...new Set(tableData.map((r) => r[key]))]
                .filter((v) => v !== undefined && v !== null);
            // if (key === "key") return null; // fully hide key column

            if (key === "discard") {
                return {
                    title: key,
                    dataIndex: key,
                    // fixed: 'start',
                    filters: uniqueValues.map((v) => ({ text: String(v), value: v })),
                    onFilter: (value, record) => record[key] === value,
                    minWidth: 200,
                    sorter: (a, b) => String(a[key] ?? "").localeCompare(String(b[key] ?? "")),
                    render: (_, record) => (
                        <CreatableSelect
                            value={record.discard !== undefined && record.discard !== null ? { label: String(record.discard), value: record.discard } : null}
                            options={Array.isArray(options) ? options.map((o) => ({ label: String(o), value: o })) : []}
                            onChange={(v) => handleDiscardChange(v, record)}
                            menuPortalTarget={document.body}
                        />
                    ),
                };
            }

            if (key === "outlier") {
                return {
                    title: key,
                    dataIndex: key,
                    // fixed: 'start',
                    filters: uniqueValues.map((v) => ({ text: String(v), value: v })),
                    onFilter: (value, record) => record[key] === value,
                    minWidth: 200,
                    sorter: (a, b) => String(a[key] ?? "").localeCompare(String(b[key] ?? "")),
                    render: (_, record) => (
                        <CreatableSelect
                            value={record.outlier !== undefined && record.outlier !== null ? { label: String(record.outlier), value: record.outlier } : null}
                            options={Array.isArray(options) ? options.map((o) => ({ label: String(o), value: o })) : []}
                            onChange={(v) => handleOutlierChange(v, record)}
                            menuPortalTarget={document.body}
                        />
                    ),
                };
            }

            if (key === "Cluster") {
                return {
                    title: key,
                    dataIndex: key,
                    // fixed: 'start',
                    filters: uniqueValues.map((v) => ({ text: String(v), value: v })),
                    onFilter: (value, record) => record[key] === value,
                    defaultSortOrder: "ascend",
                    sorter: (a, b) => Number(a[key]) - Number(b[key]),
                };
            }

            return {
                title: key,
                dataIndex: key,
                filters: uniqueValues.map((v) => ({ text: String(v), value: v })),
                onFilter: (value, record) => record[key] === value,
                sorter: (a, b) => String(a[key] ?? "").localeCompare(String(b[key] ?? "")),
                render: (text) => (
                    <Tooltip title={text}>
                        <div style={ellipsisStyle}>{String(text ?? "")}</div>
                    </Tooltip>
                ),
            };
        }).filter(Boolean);

        // Reorder important columns: Cluster (1st), cell_type (2nd), discard (3rd if exists)
        const getIndex = (name) => cols.findIndex((c) => c.dataIndex === name);

        const moveTo = (name, position) => {
            const idx = getIndex(name);
            if (idx > -1) {
                const [col] = cols.splice(idx, 1);
                cols.splice(position, 0, col);
            }
        };

        moveTo("Cluster", 0);
        moveTo("discard", 1);
        moveTo("outlier", 2);

        cols.unshift({
            title: "Operation",
            key: "operation",
            // fixed: 'end',
            render: (_, record) => (
                <Popconfirm
                    title={`Are you sure you want to delete Cluster ${record.Cluster}?`}
                    onConfirm={() => handleDelete(record)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button danger size="small">Delete</Button>
                </Popconfirm>
            ),
        });

        return cols;
    }, [tableData, options]);

    return (
        <>
            <Table
                rowKey="Cluster"
                columns={columns}
                dataSource={tableData}
                pagination={false}
                scroll={{ x: true }}
            />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <Button type="default" onClick={handleUndoDelete} disabled={deletedRows.length === 0}>
                    Restore Deleted Rows
                </Button>
                <Button type="primary" onClick={handleSubmit} disabled={tableData.length === 0 && deletedRows.length === 0}>
                    Submit Changes
                </Button>
            </div>
        </>
    );
}
