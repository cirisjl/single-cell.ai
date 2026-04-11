import random
import numpy as np
import networkx as nx
import zss
from math import inf
from grakel import GraphKernel, Graph


def trajectory_metrics(traj, bm_traj, root_node):
    # Graph edit distance
    traj_dict = traj_to_dict(traj)
    bm_traj_dict = traj_to_dict(bm_traj)
    traj_ls = []
    for key in traj_dict.keys():
        traj_ls.append((traj_dict[key], key)) 

    bm_traj_ls = []
    for key in bm_traj_dict.keys():
        bm_traj_ls.append((bm_traj_dict[key], key))

    traj_ls = sorted(traj_ls, key=lambda edge: (edge[0], edge[1]))
    bm_traj_ls = sorted(bm_traj_ls, key=lambda edge: (edge[0], edge[1]))
    
    G1 = nx.DiGraph()
    G1.add_edges_from(bm_traj_ls)

    G2 = nx.DiGraph()
    G2.add_edges_from(traj_ls)

    # Calculate the graph edit distance
    distance = graph_edit_distance(G1, G2)
    
    max_distance = 4*len(bm_traj_dict.keys()) + 2
    
    ged_score = (max_distance-distance)/max_distance


    # Jaccard similarity coefficient
    total_n = len(bm_traj_dict.keys()) + len(traj_dict.keys())

    nn = 0
    for key in bm_traj_dict.keys():
        if key in traj_dict.keys():
            if bm_traj_dict[key] == traj_dict[key]:
                nn += 1

    total_n = total_n - nn
    jsc_score = nn/total_n


    # Graph kernel score
    traj_ls = sorted(traj_ls, key=lambda edge: (edge[0], edge[1]))
    bm_traj_ls = sorted(bm_traj_ls, key=lambda edge: (edge[0], edge[1]))

    gks_score = graph_kernel_score(bm_traj_ls, traj_ls, root_node=root_node)


    # Tree edit distance
    # Build trees from edge lists
    bm_tree = build_tree_from_edges(bm_traj_ls, root_node)
    tree = build_tree_from_edges(traj_ls, root_node)

    # Calculate tree edit distance
    tree_distance = zss.distance(
        tree, bm_tree,
        get_children=lambda node: node.children,
        insert_cost=insert_cost,
        remove_cost=remove_cost,
        update_cost=update_cost
    )
    tree_max_distance = 2*len(bm_traj_dict.keys())-2
    ted_score = (tree_max_distance-tree_distance)/tree_max_distance

    mean = (ged_score + gks_score + jsc_score + ted_score)/4

    return float('{:.4f}'.format(ged_score)), float('{:.4f}'.format(gks_score)), float('{:.4f}'.format(jsc_score)), float('{:.4f}'.format(ted_score)), float('{:.4f}'.format(mean))


def traj_to_dict(df):
    graph = {}
    for i, row in df.iterrows():
        graph[row['to']] = row['from']
        
    return graph



class TreeNode:
    def __init__(self, label):
        self.label = label
        self.children = []


def build_tree_from_edges(edges, root_node):
    nodes = {}
    for parent, child in edges:
        if parent not in nodes:
            nodes[parent] = TreeNode(parent)
        if child not in nodes:
            nodes[child] = TreeNode(child)
        nodes[parent].children.append(nodes[child])
    return nodes[root_node]  # Return the root node


def insert_cost(node):
    return 1


def remove_cost(node):
    return 1


def update_cost(node1, node2):
    return 0 if node1.label == node2.label else inf


def graph_edit_distance(G1, G2):
    # Initialize cost for edges
    node_cost = 0
    nodes1 = set(G1.nodes)
    nodes2 = set(G2.nodes)

    # Calculate edge substitution cost
    for node1 in nodes1:
        if node1 in nodes2:
            nodes2.remove(node1)  # Matched edges
        else:
            node_cost += 1  # Unmatched edge in G1 (deletion)

    node_cost += len(nodes2)  # Remaining unmatched edges in G2 (insertion)

    # Initialize cost for edges
    edge_cost = 0
    edges1 = set(G1.edges)
    edges2 = set(G2.edges)

    # Calculate edge substitution cost
    for edge1 in edges1:
        if edge1 in edges2:
            edges2.remove(edge1)  # Matched edges
        else:
            edge_cost += 1  # Unmatched edge in G1 (deletion)

    edge_cost += len(edges2)  # Remaining unmatched edges in G2 (insertion)

    return node_cost + edge_cost


def graph_kernel_score(edges1, edges2, root_node):
    edges1 = find_root_node(edges1, root_node)
    edges2 = find_root_node(edges2, root_node)

    G1 = nx.Graph()
    G1.add_edges_from(edges1)

    G2 = nx.Graph()
    G2.add_edges_from(edges2)
    
    grakel_G1 = nx_to_grakel(G1)
    grakel_G2 = nx_to_grakel(G2)

    # Initialize the Weisfeiler-Lehman subtree kernel
    gk = GraphKernel(kernel={"name": "shortest_path"}, normalize=True)

    # Compute the kernel matrix
    G = [grakel_G1, grakel_G2]
    K = gk.fit_transform(G)
    
    final_score = K[0,1]
    
    return final_score

# Convert NetworkX graphs to Grakel format
def nx_to_grakel(G):
    nodes = list(G.nodes)
    edges = list(G.edges)
    node_labels = {node: i for i, node in enumerate(nodes)}
    edges_transformed = [(node_labels[edge[0]], node_labels[edge[1]]) for edge in edges]
    return (edges_transformed, {i: label for label, i in node_labels.items()})


def find_root_node(edges1, root_node):
    if edges1[0][0] == root_node:
        pass

    else:
        for i in range(1, len(edges1)):
            if edges1[i][0] == root_node:
                aaa = edges1[0]
                edges1[0] = edges1[i]
                edges1[i] = aaa
                i = len(edges1)+1
            else:
                pass
            
    return edges1