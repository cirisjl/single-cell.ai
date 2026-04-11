import torch
import scipy
import numpy
import math
import pandas as pd
from sklearn.ensemble import IsolationForest
import random
from os import cpu_count
from scipy.spatial import cKDTree
from scipy.spatial.distance import pdist, squareform


def build_adj_graph(adata, use_rep='X_draw_graph_trajectory', k=10, data_dtype = torch.float32, device='cpu'):
    """
    """
    
    feature_matrix = extract_data_matrix_from_adata(adata, use_rep=use_rep, torch_tensor=True, 
                                                    data_dtype=data_dtype, device=device)
    edge_index = hidden_build_edge_index(feature_matrix, 
                                         k_min=0, 
                                         k_max=k, 
                                         self_edge=True, 
                                         remov_edge_prob=None, 
                                         node_IF_labels=None,
                                         device=device)
    
    adata.uns['adj_edge_index'] = edge_index.cpu().numpy()


def build_graph(adata, use_rep="X_dif", k=10, self_edge = False, prune=False, data_dtype = torch.float32, device='cpu'):
    """
    """
    
    feature_matrix = extract_data_matrix_from_adata(adata, use_rep=use_rep, torch_tensor=True, 
                                                    data_dtype=data_dtype, device=device)
    node_IF_labels = numpy.array(adata.obs['isolation']) if prune else None
    edge_index = hidden_build_edge_index(feature_matrix, 
                                         k_min=0, 
                                         k_max=k, 
                                         self_edge=self_edge, 
                                         remov_edge_prob=None, 
                                         node_IF_labels=node_IF_labels, 
                                         device=device)
    edge_index = edge_index.cpu().numpy()
    
    adata.uns['edge_index'] = edge_index


def extract_data_matrix_from_adata(adata, use_rep=None, torch_tensor=True, data_dtype=torch.float32, device='cpu'):
    """
    """

    if use_rep is not None:
        feature_matrix = adata.obsm[use_rep]
    elif isinstance(adata.X, scipy.sparse.spmatrix): 
        feature_matrix = adata.X.todense()
    else:
        feature_matrix = adata.X
        
    if torch_tensor:
        try:
            feature_matrix = torch.tensor(feature_matrix, dtype=data_dtype, device=device)  
        except ValueError as e:
            # Check if the error is due to negative strides
            if "negative strides" in str(e):
                print("Caught ValueError due to negative strides in the given numpy array. Transform it into contiguous array.")
                feature_matrix= np.ascontiguousarray(feature_matrix)
                feature_matrix = torch.tensor(feature_matrix, dtype=data_dtype, device=device) 
            else:
                raise e
        
    return feature_matrix
    

def hidden_build_edge_index(feature_matrix, k_min=0, k_max=10, self_edge=False, remov_edge_prob=None, node_IF_labels=None, device='cpu'):
    
    num_of_nodes = feature_matrix.size()[0]
    
    edge_index = knn_graph(feature_matrix.to(device), k_min=k_min, k_max=k_max, self_edge=self_edge)
    
    if node_IF_labels is not None:
        edge_index = prune_fn(edge_index, node_IF_labels)
        
    if remov_edge_prob is not None:
        mask = torch.rand(edge_index.size(1)) > remov_edge_prob
        edge_index = edge_index[:, mask]
        
    return edge_index


def knn_graph(feature_matrix, k_min=0, k_max=10, self_edge = False):
    """
    """
   
    # Calculate the pairwise squared distances between points
    dist_matrix = torch.cdist(feature_matrix, feature_matrix, p=2)

    # Find the indices of the k nearest neighbors for each point
    if self_edge:
        knn_indices = torch.argsort(dist_matrix, dim=1)[:, k_min: k_max]  # Exclude the point itself (at index 0)
        # construct edge index from knn_indices
        edge_index = knn_indices_to_edge_index(knn_indices)
    
    else:
        knn_indices = torch.argsort(dist_matrix, dim=1)[:, k_min+1: k_max+1] # the point itself may not at index 0(overlapped points)
        # construct edge index from knn_indices
        edge_index = knn_indices_to_edge_index(knn_indices)

        mask = edge_index[0] != edge_index[1]
        edge_index = edge_index[:, mask]

    return edge_index


def knn_indices_to_edge_index(knn_indices):
    """
    """
    num_points, k = knn_indices.shape

    # Create source and target node index tensors
    src_nodes = torch.arange(num_points, device=knn_indices.device).view(-1, 1).repeat(1, k).view(-1)
    trg_nodes = knn_indices.reshape(-1)

    # Concatenate the source and target node index tensors to create the edge_index tensor
    edge_index = torch.stack([src_nodes, trg_nodes], dim=0)

    return edge_index


def edge_index_to_adj(edge_index, num_of_nodes):
    """
    construct adjacency matrix from edge index
    """
    adjacency_matrix = torch.zeros((num_of_nodes, num_of_nodes), dtype=edge_index.dtype, device=edge_index.device)
    adjacency_matrix[edge_index[0], edge_index[1]] = 1

    return adjacency_matrix


def get_community(adata, use_groups='labels', community_name='community'):
    
    groups = adata.obs[use_groups].astype(str)
    community_size = {}
    community_component = {}
    community_keys = groups.unique()
    
    for group_name in community_keys:
        community_component[group_name] = numpy.where(groups == group_name)[0]
        community_size[group_name] = len(community_component[group_name])/len(groups)
    
    adata.uns[community_name] = {}
    adata.uns[community_name]['use_groups'] = use_groups
    adata.uns[community_name]['keys'] = community_keys
    adata.uns[community_name]['component'] = community_component
    adata.uns[community_name]['size'] = community_size


def community_umap(adata, use_umap='X_umap', use_community='community'):
    
    groups = adata.obs[adata.uns[use_community]['use_groups']].astype(str)
    
    feature_umap = adata.obsm[use_umap]
    
    community_umap = {}
    array_umap = []

    for group_name in adata.uns[use_community]['keys']:
        group_umap = feature_umap[numpy.where(groups == group_name)[0], :]
        community_umap[group_name] = group_umap.mean(axis=0)
        array_umap.append(community_umap[group_name])
    
    adata.uns[use_community]['pos_dict'] = community_umap
    adata.uns[use_community]['pos_array'] = tune_community_umap(numpy.array(array_umap), 
                                                               tune_pos=0.3, 
                                                               tune_pos_scale=1.0)
    for ii in range(len(adata.uns[use_community]['keys'])):
        group_name = adata.uns[use_community]['keys'][ii]
        adata.uns[use_community]['pos_dict'][group_name] = adata.uns[use_community]['pos_array'][ii,:]



def tune_community_umap(community_umap, tune_pos=0.3, tune_pos_scale=1.0):
    
    range_1 = community_umap[:, 0].max() - community_umap[:, 0].min()
    range_2 = community_umap[:, 1].max() - community_umap[:, 1].min()
    
    distances = pdist(community_umap, metric='euclidean')

    # Convert the condensed distance matrix to a square matrix
    distance_matrix = squareform(distances)

    threshold = tune_pos*numpy.mean(distances)

    # Extract node pairs with distance below the mean distance
    node_pairs_below = []

    for i in range(distance_matrix.shape[0]):
        for j in range(i+1, distance_matrix.shape[1]):
            if distance_matrix[i][j] < threshold:
                node_pairs_below.append((i, j))

    for node_pairs in node_pairs_below:

        umap_1 = community_umap[node_pairs[0]]
        umap_2 = community_umap[node_pairs[1]]
        umap_dif = umap_2 - umap_1
        distance = math.sqrt(umap_dif[0]*umap_dif[0] + umap_dif[1]*umap_dif[1])
        if distance < threshold:
            difference = threshold - distance
            axis_1 = difference * umap_dif[0]/distance
            axis_2 = difference * umap_dif[1]/distance

            if axis_1 > 0:
                community_umap[community_umap[:, 0] >=umap_2[0], 0] += axis_1
            else:
                community_umap[community_umap[:, 0] <=umap_2[0], 0] += axis_1

            if axis_2 > 0:
                community_umap[community_umap[:, 1] >=umap_2[1], 1] += axis_2
            else:
                community_umap[community_umap[:, 1] <=umap_2[1], 1] += axis_2   
        else:
            pass
    
    new_range_1 = community_umap[:, 0].max() - community_umap[:, 0].min()
    new_range_2 = community_umap[:, 1].max() - community_umap[:, 1].min()
    
    community_umap[:, 0] *= tune_pos_scale*range_1/new_range_1
    community_umap[:, 1] *= tune_pos_scale*range_2/new_range_2
        
    return community_umap


def get_community_attention(community, edge_index, device='cpu'):
    
    community_keys = community['keys']
    community_component = community['component'].copy() 
    
    for key in community_component.keys():
        community_component[key] = torch.tensor(community_component[key], device=device)
    
    
    edge_index = torch.tensor(edge_index, device=device)
    
    community_attention_matrix = torch.zeros((len(community_keys),len(community_keys)), device=device)  
    
    i=-1
    for group_src in community_keys:
        i+=1
        j=-1
        for group_trg in community_keys:
            j+=1
            edge_src_filter = torch.isin(edge_index[0], community_component[group_src])
            edge_trg_filter = torch.isin(edge_index[1], community_component[group_trg])
            edge_filter = edge_trg_filter & edge_src_filter
            
            edge_src_filter_op = torch.isin(edge_index[1], community_component[group_src])
            edge_trg_filter_op = torch.isin(edge_index[0], community_component[group_trg])
            
            edge_filter_op = edge_trg_filter_op & edge_src_filter_op
            
            edge_filter = edge_filter | edge_filter_op
            
            group_attention = torch.sum(edge_filter)/(len(community_component[group_src])*len(community_component[group_trg]))
            
            community_attention_matrix[i,j] = group_attention
    
    
    
    community_attention_matrix = community_attention_matrix.cpu().numpy()
    numpy.fill_diagonal(community_attention_matrix, 0)
    
    return community_attention_matrix


def attention_to_traj(community_weight_matrix, community_keys, origin_group, shape='mst_tree'):
    
    num_nodes = community_weight_matrix.shape[0]
    
    community_weight_add = 0
    nn = 0
    for i in range(num_nodes):
        for j in range(num_nodes):
            if community_weight_matrix[i, j] > 0:
                community_weight_add = community_weight_add + community_weight_matrix[i, j]
                nn = nn + 1

    aaa = nn*community_weight_matrix/community_weight_add
    
    attention_matrix = 1/(numpy.log(aaa + 1))
    
    
    origin = numpy.where(community_keys==origin_group)[0][0]
    
    if shape=='mst_tree':
        trajectory_list_assi = prim_mst(attention_matrix, origin)
    elif shape=='mdo_tree':
        trajectory_list_assi, mdo_dis = min_distance_to_origin(attention_matrix, origin)
    elif shape==None:
        trajectory_list_assi = adjacency_matrix_to_edge_list(attention_matrix)
    
    trajectory_list = []
    for item in trajectory_list_assi:
        trajectory_list.append((community_keys[item[0]], community_keys[item[1]], item[2]))
                    
    return trajectory_list


def min_distance_to_origin(adj_matrix, origin):
    num_nodes = adj_matrix.shape[0]
    visited = [False] * num_nodes
    mdo_dis = [float('inf')]* num_nodes
    mdo_edges = []

    # Start from the origin node
    visited[origin] = True
    mdo_dis[origin] = 0.0

    for _ in range(num_nodes - 1):
        mdo_edge = (None, None, float('inf'))
        mdo_edge_sum = (None, None, float('inf'))
        for i in range(num_nodes):
            if visited[i]:
                for j in range(num_nodes):
                    if not visited[j] and adj_matrix[i, j] > 0:
                        if (adj_matrix[i, j]+mdo_dis[i]) < mdo_edge_sum[2]:
                            mdo_edge = (i, j, adj_matrix[i, j])
                            mdo_edge_sum = (i, j, adj_matrix[i, j]+mdo_dis[i])
                            mdo_dis[j] = adj_matrix[i, j]+mdo_dis[i]
        visited[mdo_edge[1]] = True
        mdo_edges.append(mdo_edge)

    return mdo_edges, mdo_dis

    
def prune_fn(edge_index, node_IF_labels):
    
    node_IF_labels = torch.tensor(node_IF_labels, device=edge_index.device)
    
    normal_nodes = torch.where(node_IF_labels == 1)[0]
    anomalous_nodes = torch.where(node_IF_labels == -1)[0]
    
    mask_1 = torch.isin(edge_index[0,:], anomalous_nodes)
    mask_2 = torch.isin(edge_index[1,:], normal_nodes)
    
    mask = mask_1 & mask_2

    edge_index = edge_index[:,~mask]
    
    return edge_index


def adjacency_matrix_to_edge_list(adj_matrix):
    edge_list = []
    num_nodes = adj_matrix.shape[0]

    for i in range(num_nodes):
        for j in range(i + 1, num_nodes):
            if adj_matrix[i, j] != 0:
                edge_list.append((i, j, adj_matrix[i, j]))
                edge_list.append((j, i, adj_matrix[i, j]))

    return edge_list
    

def build_trajectory(adata, 
                     use_groups = 'labels',
                     use_community='community',
                     origin_group = None,
                     use_rep = 'X_draw_graph_trajectory',
                     traj_shape='mdo_tree',
                     device='cpu'):
    """
    """
    
    groups = adata.obs[use_groups].astype(str)
    edge_index = adata.uns['edge_index'].copy()
    
    if use_community is not None:
        community = adata.uns[use_community]
        
    else:
        get_community(adata, use_groups = use_groups, community_name='community')
        community = adata.uns['community']
        use_community = 'community'
    
    # shape: num_community * num_community
    community_attention_matrix = get_community_attention(community, edge_index, device=device)
    
    traj_list = attention_to_traj(community_attention_matrix, adata.uns[use_community]['keys'], origin_group, shape=traj_shape)
    
    connectivities = attention_to_traj(community_attention_matrix, adata.uns[use_community]['keys'], origin_group, shape=None)
    
    # construct trajectory dataframe
    from_list = []
    to_list = []
    weight_list = []
    for item in traj_list:
        from_list.append(item[0])
        to_list.append(item[1])
        weight_list.append(item[2])
    traj_dict = {'from': from_list,
                    'to': to_list,
                    'weight': weight_list}        
    traj_df = pd.DataFrame(traj_dict)
    
    adata.uns['trajectory'] = traj_df
    adata.uns['connectivities'] = connectivities
    
    adata.uns[use_community]['attention_matrix'] = community_attention_matrix



